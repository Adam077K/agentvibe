    # THE MUTATION, and it is probe 4b of planning/reviews/G-02-recheck-03.md. Nothing is
    # removed, nothing is disjoined and nothing is quantified: each of the three PINNED
    # conjuncts of ('SalesAgreement','performed') survives character for character inside
    # `present(value: ...)`. `present` takes one argument typed JsonValue, so what is
    # buried there is a value the operator reads, never a predicate the body's truth
    # depends on -- `present` asks only whether it is there.
    #
    # Measured before the repair, with CONTRACTS_FIXTURE_RUN=1: author_phase_content.py
    # regenerated cleanly and every registry-level check passed at exit 0 with 269,694
    # checks -- schema, AST, the drift oracle, the pin table and RC-03 alike -- because
    # the walker visited every dict value it could reach and reported each buried conjunct
    # negated=False disjoined=False, which is to say DEMANDED.
    #
    # A repair aimed only at `forall` leaves this open, which is why it ships as its own
    # fixture: the two share a root cause and not a contract. If this fixture ever passes
    # validation again, the walker is descending into value slots again and a pin has gone
    # back to asserting that the registry MENTIONS what a finding required.
    ("SalesAgreement", "performed"): spec(
        "Performance of a sale is accepted delivery plus discharged or transferred "
        "obligations -- never payment alone. The agreement names its own Fulfillment "
        "record, that Fulfillment is currently `delivered`, and every linked Obligation "
        "is `discharged` or `transferred`. The correlated native object is the DELIVERY, "
        "not the charge: a settled payment is evidence about money and establishes "
        "nothing about whether the service arrived, so it moves the agreement to "
        "`accepted` or `partially-performed` and can never move it here.",
        ["c-fulfillment", "c-sales-outcome", "arch6-delivery", "arch3-outcome"],
        [("bury", ("nfp", ["/payload/fulfillment_ref", "/payload/obligation_refs",
                           "/payload/acceptance_evidence", "/payload/agreed_terms"])),
         ("bury", ("rpp", [("/payload/fulfillment_ref", ["delivered"], False),
                           ("/payload/obligation_refs", ["discharged", "transferred"],
                            False)])),
         ("bury", ("nc", "delivered")),
         AF, AR],
        hard=["bury"]),

