
def assess_url_risk(features: dict) -> dict:
    """
    Assess URL indicators using transparent heuristic rules.

    This is not an ML prediction or a calibrated probability.
    Indicators alone cannot prove that a URL is malicious.
    """

    indicators = []
    caution_count = 0

    if features.get("ip_address_host", False):
        indicators.append({
            "code": "ip_address_host",
            "severity": "elevated",
            "message": (
                "The URL uses an IP address instead of a "
                "traditional domain name. Inspect the destination "
                "carefully; this alone does not prove phishing."
            ),
        })

    if features.get("at_symbol_present", False):
        indicators.append({
            "code": "at_symbol_present",
            "severity": "caution",
            "message": (
                "The URL contains an @ character. Check how the "
                "URL is parsed and which hostname it points to."
            ),
        })
        caution_count += 1

    if not features.get("https_present", False):
        indicators.append({
            "code": "https_not_detected",
            "severity": "caution",
            "message": (
                "HTTPS was not detected. This can be a security "
                "concern, but HTTP alone does not prove phishing."
            ),
        })
        caution_count += 1

    if features.get("suspicious_keyword_present", False):
        indicators.append({
            "code": "suspicious_keyword",
            "severity": "caution",
            "message": (
                "The URL contains words such as login or verify, "
                "which can occur in deceptive links but are also "
                "common in legitimate URLs."
            ),
        })
        caution_count += 1

    if features.get("url_length", 0) >= 100:
        indicators.append({
            "code": "long_url",
            "severity": "caution",
            "message": (
                "The URL is unusually long. Long URLs can be "
                "legitimate, so inspect the hostname and path."
            ),
        })
        caution_count += 1

    if features.get("dot_count", 0) >= 5:
        indicators.append({
            "code": "many_dots",
            "severity": "caution",
            "message": (
                "The URL contains many dots. Inspect the hostname "
                "and subdomains for possible impersonation."
            ),
        })
        caution_count += 1

    has_elevated_indicator = any(
        item["severity"] == "elevated"
        for item in indicators
    )

    if has_elevated_indicator:
        category = "review_recommended"
        summary = (
            "One or more indicators warrant closer inspection."
        )
    elif caution_count >= 2:
        category = "caution"
        summary = (
            "Multiple caution indicators were found. "
            "Review the URL before trusting it."
        )
    else:
        category = "no_obvious_indicators"
        summary = (
            "Few indicators were detected by these rules. "
            "This does not establish that the URL is safe."
        )

    return {
        "method": "heuristic_rules",
        "rules_version": "1.0",
        "category": category,
        "summary": summary,
        "indicator_count": len(indicators),
        "indicators": indicators,
        "limitations": (
            "This is a rule-based assessment, not an ML prediction "
            "or calibrated probability. Indicators do not prove a "
            "URL is malicious, and missing indicators do not "
            "guarantee safety."
        ),
    }
