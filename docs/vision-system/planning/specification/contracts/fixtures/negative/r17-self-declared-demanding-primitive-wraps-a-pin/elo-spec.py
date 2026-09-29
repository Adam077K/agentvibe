    # THE MUTATION, and it is probes 3b and 8e of planning/reviews/G-02-recheck-04.md.
    # Nothing is removed and nothing is disjoined: each of the three PINNED conjuncts of
    # ('SalesAgreement','performed') survives character for character, moved inside
    # `every_linked_obligation` over `/payload/obligation_refs` -- a primitive this
    # fixture REGISTERS, declaring its own `predicate` child `demanded`.
    # records.schema.json declares that field an array in `payload.required` with NO
    # `minItems`, so `[]` is schema-valid and the quantifier is vacuously true on such a
    # record: the agreement need not name its Fulfillment, that Fulfillment need not be
    # `delivered`, no Obligation need be `discharged` or `transferred`, and nothing need be
    # natively correlated. G2-01's counterexample, restored.
    #
    # Measured before the repair, with all 36 fixtures of the day in place: exit 0, 288,665
    # checks -- 45 MORE than the baseline's 288,620 -- and 36 of 36 negative fixtures still
    # rejecting. The guard-distinctness ratchet green, the criterion-content drift oracle
    # green, all 25 pins and 44 rows satisfied, RC-03 silent.
    #
    # r15-pinned-conjunct-inside-a-vacuous-forall cannot catch this: it names `forall` by
    # hand, and this operator is not `forall`. r15-unregistered-operator-in-a-predicate-
    # position cannot catch it either: that is the UNDECLARED case, and this one declares
    # itself. If this fixture ever passes validation again, the demand table has stopped
    # being closed against the MISDECLARED and a registry author can once more decide,
    # alone, what satisfies a pin.
    ("SalesAgreement", "performed"): spec(
        "Performance of a sale is accepted delivery plus discharged or transferred "
        "obligations -- never payment alone. The agreement names its own Fulfillment "
        "record, that Fulfillment is currently `delivered`, and every linked Obligation "
        "is `discharged` or `transferred`. The correlated native object is the DELIVERY, "
        "not the charge: a settled payment is evidence about money and establishes "
        "nothing about whether the service arrived, so it moves the agreement to "
        "`accepted` or `partially-performed` and can never move it here.",
        ["c-fulfillment", "c-sales-outcome", "arch6-delivery", "arch3-outcome"],
        [("elo", "/payload/obligation_refs",
          ("every", [("nfp", ["/payload/fulfillment_ref", "/payload/obligation_refs",
                              "/payload/acceptance_evidence", "/payload/agreed_terms"]),
                     ("rpp", [("/payload/fulfillment_ref", ["delivered"], False),
                              ("/payload/obligation_refs", ["discharged", "transferred"],
                               False)]),
                     ("nc", "delivered")])),
         AF, AR],
        hard=["elo"]),

