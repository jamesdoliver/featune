"""AI chat assistant router.

Exposes an endpoint for query-based track discovery. Users describe what
they are looking for in natural language and the system returns the most
relevant approved tracks.

TODO: Replace the keyword-matching implementation with actual LLM
integration (e.g. OpenAI embeddings or Claude) once an API key is
available.  The current approach splits the query into individual words
and scores each track based on case-insensitive substring matches
against title, genre, and mood fields.
"""

import os
import re
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client

router = APIRouter()

# ---------------------------------------------------------------------------
# Supabase client (uses service-role key for server-side access)
# ---------------------------------------------------------------------------

_supabase_url: str | None = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
_supabase_key: str | None = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")


def _get_supabase() -> Client:
    """Lazily build and return a Supabase client.

    Raises HTTPException(503) when the required environment variables are
    not configured.
    """
    if not _supabase_url or not _supabase_key:
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        )
    return create_client(_supabase_url, _supabase_key)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class ChatQueryRequest(BaseModel):
    query: str


class TrackResult(BaseModel):
    track_id: str
    score: float


class ChatQueryResponse(BaseModel):
    results: list[TrackResult]


# ---------------------------------------------------------------------------
# Keyword matching helpers
# ---------------------------------------------------------------------------

# Common English stop-words to ignore when scoring
_STOP_WORDS = frozenset(
    {
        "a", "an", "the", "for", "and", "or", "but", "is", "in", "on",
        "of", "to", "it", "with", "my", "me", "i", "this", "that",
        "some", "any", "very", "really", "just", "so", "like", "want",
        "need", "looking", "something", "find", "give", "get",
    }
)


def _tokenize(text: str) -> list[str]:
    """Split text into lowercase alphanumeric tokens."""
    return [w for w in re.findall(r"[a-z0-9]+", text.lower()) if w not in _STOP_WORDS]


def _score_track(query_tokens: list[str], track: dict[str, Any]) -> float:
    """Return a relevance score (0.0 – 1.0) for *track* given *query_tokens*.

    Each query token can match against the track's title, genre, or mood.
    A match in the title counts slightly more than genre/mood.
    """
    if not query_tokens:
        return 0.0

    title = (track.get("title") or "").lower()
    genre = (track.get("genre") or "").lower()
    mood = (track.get("mood") or "").lower()
    vocalist_type = (track.get("vocalist_type") or "").lower()

    matched_weight = 0.0
    total_weight = len(query_tokens)

    for token in query_tokens:
        if token in title:
            matched_weight += 1.2  # title gets a slight boost
        elif token in genre:
            matched_weight += 1.0
        elif token in mood:
            matched_weight += 1.0
        elif token in vocalist_type:
            matched_weight += 0.8
        elif token == "ai" and track.get("is_ai_generated"):
            matched_weight += 1.0
        elif token == "human" and not track.get("is_ai_generated"):
            matched_weight += 0.8

    # Normalise to 0–1 (can exceed 1.0 due to title boost, so clamp)
    score = matched_weight / total_weight if total_weight else 0.0
    return min(score, 1.0)


# ---------------------------------------------------------------------------
# POST /query
# ---------------------------------------------------------------------------

@router.post("/query", response_model=ChatQueryResponse)
async def chat_query(body: ChatQueryRequest) -> ChatQueryResponse:
    """Search for tracks matching a natural-language query.

    The endpoint fetches all approved tracks from Supabase, scores each
    one against the query using simple keyword matching, and returns the
    top 5 results sorted by relevance.
    """
    query_text = body.query.strip()
    if not query_text:
        raise HTTPException(status_code=422, detail="query must not be empty")

    supabase = _get_supabase()

    # Fetch approved tracks with the fields we need for matching + display
    response = (
        supabase.table("tracks")
        .select("id, title, genre, mood, bpm, key, vocalist_type, is_ai_generated")
        .eq("status", "approved")
        .execute()
    )

    tracks: list[dict[str, Any]] = response.data or []

    if not tracks:
        return ChatQueryResponse(results=[])

    # Score and rank
    query_tokens = _tokenize(query_text)

    scored: list[tuple[dict[str, Any], float]] = []
    for track in tracks:
        score = _score_track(query_tokens, track)
        if score > 0:
            scored.append((track, score))

    # Sort descending by score, take top 5
    scored.sort(key=lambda item: item[1], reverse=True)
    top_results = scored[:5]

    return ChatQueryResponse(
        results=[
            TrackResult(track_id=str(t["id"]), score=round(s, 2))
            for t, s in top_results
        ]
    )
