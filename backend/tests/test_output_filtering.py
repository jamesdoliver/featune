"""Tests for output filtering in the chat router."""

from app.routers.chat import validate_output


class TestValidateOutput:
    """Test cases for the validate_output function."""

    # -- Helper ---------------------------------------------------------

    @staticmethod
    def _make_result(reason: str, track_id: str = "abc-123", score: float = 0.9) -> dict:
        return {"track_id": track_id, "score": score, "reason": reason}

    REPLACED_REASON = "Matches your search criteria"

    # -- Safe results pass through unchanged ----------------------------

    def test_safe_results_pass_through_unchanged(self):
        """Results with clean reasons should be returned as-is."""
        safe_reasons = [
            "Great summer vibe with upbeat energy",
            "Lyrics mention heartbreak and rain",
            "Female AI vocal in C minor at 128 BPM",
            "Matches the R&B mood you described",
            "Created by a popular artist on the platform",
        ]
        for reason in safe_reasons:
            results = [self._make_result(reason)]
            filtered = validate_output(results)
            assert len(filtered) == 1
            assert filtered[0]["reason"] == reason, (
                f"Safe reason '{reason}' should pass through unchanged"
            )

    # -- URLs blocked ---------------------------------------------------

    def test_http_url_in_reason_is_replaced(self):
        """HTTP/HTTPS URLs in reason should be replaced."""
        for url_reason in [
            "Listen at http://example.com/track.mp3",
            "Available at https://cdn.featune.com/audio/preview",
            "Download from HTTP://FILES.EXAMPLE.COM",
        ]:
            results = [self._make_result(url_reason)]
            filtered = validate_output(results)
            assert filtered[0]["reason"] == self.REPLACED_REASON, (
                f"Reason with URL '{url_reason}' should be replaced"
            )

    # -- S3 paths blocked -----------------------------------------------

    def test_s3_path_in_reason_is_replaced(self):
        """S3 bucket URLs in reason should be replaced."""
        results = [self._make_result("File located at s3://featune-audio/private/track.wav")]
        filtered = validate_output(results)
        assert filtered[0]["reason"] == self.REPLACED_REASON

    # -- Supabase URLs blocked ------------------------------------------

    def test_supabase_url_in_reason_is_replaced(self):
        """Supabase URLs in reason should be replaced."""
        for supabase_reason in [
            "Stored at abc123.supabase.co/storage",
            "Available on SUPABASE.CO",
        ]:
            results = [self._make_result(supabase_reason)]
            filtered = validate_output(results)
            assert filtered[0]["reason"] == self.REPLACED_REASON, (
                f"Reason with Supabase URL '{supabase_reason}' should be replaced"
            )

    # -- File extensions blocked ----------------------------------------

    def test_file_extensions_in_reason_are_replaced(self):
        """File extension references (.mp3, .wav, .pdf, .zip) should be replaced."""
        extension_reasons = [
            "The file is track_preview.mp3",
            "Acapella delivered as vocals.wav",
            "License available as license.pdf",
            "Stems packaged in stems.zip",
        ]
        for reason in extension_reasons:
            results = [self._make_result(reason)]
            filtered = validate_output(results)
            assert filtered[0]["reason"] == self.REPLACED_REASON, (
                f"Reason with file extension '{reason}' should be replaced"
            )

    # -- Storage paths blocked ------------------------------------------

    def test_storage_paths_in_reason_are_replaced(self):
        """Storage paths containing /private/ or /public/ should be replaced."""
        for path_reason in [
            "Located in /private/audio/track123",
            "CDN path is /public/previews/clip",
        ]:
            results = [self._make_result(path_reason)]
            filtered = validate_output(results)
            assert filtered[0]["reason"] == self.REPLACED_REASON, (
                f"Reason with storage path '{path_reason}' should be replaced"
            )

    # -- Bucket references blocked --------------------------------------

    def test_bucket_reference_in_reason_is_replaced(self):
        """References to 'bucket' should be replaced."""
        results = [self._make_result("Stored in the audio bucket for creators")]
        filtered = validate_output(results)
        assert filtered[0]["reason"] == self.REPLACED_REASON

    # -- Email addresses blocked ----------------------------------------

    def test_email_address_in_reason_is_replaced(self):
        """Email addresses in reason should be replaced."""
        for email_reason in [
            "Uploaded by creator@example.com",
            "Contact admin@featune.io for help",
            "Notification sent to user@service.net",
        ]:
            results = [self._make_result(email_reason)]
            filtered = validate_output(results)
            assert filtered[0]["reason"] == self.REPLACED_REASON, (
                f"Reason with email '{email_reason}' should be replaced"
            )

    # -- API keys blocked -----------------------------------------------

    def test_api_key_in_reason_is_replaced(self):
        """API key prefixes (sk-..., sk_...) in reason should be replaced."""
        for key_reason in [
            "Authenticated with sk-abc123secretkey",
            "Key used: sk_live_abc123",
        ]:
            results = [self._make_result(key_reason)]
            filtered = validate_output(results)
            assert filtered[0]["reason"] == self.REPLACED_REASON, (
                f"Reason with API key '{key_reason}' should be replaced"
            )

    # -- Mixed safe and unsafe results ----------------------------------

    def test_mixed_safe_and_unsafe_results(self):
        """Only unsafe reasons should be replaced; safe ones kept intact."""
        results = [
            self._make_result("Great upbeat track with summer vibes", track_id="safe-1"),
            self._make_result("File at https://cdn.example.com/audio", track_id="unsafe-1"),
            self._make_result("Mellow R&B vocals in D minor", track_id="safe-2"),
            self._make_result("Stored in the private bucket at s3://data", track_id="unsafe-2"),
        ]
        filtered = validate_output(results)

        assert len(filtered) == 4

        # Safe results preserved
        assert filtered[0]["reason"] == "Great upbeat track with summer vibes"
        assert filtered[0]["track_id"] == "safe-1"
        assert filtered[2]["reason"] == "Mellow R&B vocals in D minor"
        assert filtered[2]["track_id"] == "safe-2"

        # Unsafe results replaced
        assert filtered[1]["reason"] == self.REPLACED_REASON
        assert filtered[1]["track_id"] == "unsafe-1"
        assert filtered[3]["reason"] == self.REPLACED_REASON
        assert filtered[3]["track_id"] == "unsafe-2"

    # -- Empty list -----------------------------------------------------

    def test_empty_results_list_returns_empty(self):
        """An empty results list should return an empty list."""
        assert validate_output([]) == []

    # -- Other fields preserved on replacement --------------------------

    def test_other_fields_preserved_when_reason_replaced(self):
        """track_id and score should be preserved even when reason is replaced."""
        result = {"track_id": "id-xyz", "score": 0.87, "reason": "Visit https://evil.com"}
        filtered = validate_output([result])

        assert filtered[0]["track_id"] == "id-xyz"
        assert filtered[0]["score"] == 0.87
        assert filtered[0]["reason"] == self.REPLACED_REASON
