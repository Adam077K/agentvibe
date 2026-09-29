    # THE MUTATION, and it is probe 9 of planning/reviews/G-02-recheck-02.md, kept
    # verbatim. Nothing is removed: each of the three PINNED conjuncts of
    # ('SalesAgreement','performed') survives, character for character, disjoined with
    # `present(/payload/agreed_terms)`. `agreed_terms` is in the record's own
    # `payload.required` list, so that disjunct holds for EVERY schema-valid
    # SalesAgreement and each `any` is satisfied unconditionally. The criterion therefore
    # demands nothing about delivery while containing every conjunct that says it does.
    #
    # Measured before the repair: author_phase_content.py regenerated cleanly,
    # validate_contracts.py exited 0 with 269,592 checks and 31 of 31 negative fixtures
    # still rejecting, and pinned-conjuncts.json, the fixtures and the `requires` prose
    # were all untouched. r13-derivation-weakened-then-regenerated cannot catch this: it
    # REMOVES the conjuncts, and a containment check notices a removal.
    #
    # If this fixture ever passes validation again, `disjoined` is being ignored and a pin
    # has gone back to asserting that the registry MENTIONS what a finding required.
    ("SalesAgreement", "performed"): spec(
        "Performance of a sale is accepted delivery plus discharged or transferred "
        "obligations -- never payment alone. The agreement names its own Fulfillment "
        "record, that Fulfillment is currently `delivered`, and every linked Obligation "
        "is `discharged` or `transferred`. The correlated native object is the DELIVERY, "
        "not the charge: a settled payment is evidence about money and establishes "
        "nothing about whether the service arrived, so it moves the agreement to "
        "`accepted` or `partially-performed` and can never move it here.",
        ["c-fulfillment", "c-sales-outcome", "arch6-delivery", "arch3-outcome"],
        [("either", [("nfp", ["/payload/fulfillment_ref", "/payload/obligation_refs",
                              "/payload/acceptance_evidence", "/payload/agreed_terms"]),
                     ("prF", "/payload/agreed_terms")]),
         ("either", [("rpp", [("/payload/fulfillment_ref", ["delivered"], False),
                              ("/payload/obligation_refs", ["discharged", "transferred"],
                               False)]),
                     ("prF", "/payload/agreed_terms")]),
         ("either", [("nc", "delivered"),
                     ("prF", "/payload/agreed_terms")]),
         AF, AR],
        hard=["either"]),

