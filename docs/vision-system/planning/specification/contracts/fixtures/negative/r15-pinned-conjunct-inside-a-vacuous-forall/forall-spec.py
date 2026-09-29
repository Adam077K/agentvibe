    # THE MUTATION, and it is probe 4 of planning/reviews/G-02-recheck-03.md. Nothing is
    # removed and nothing is disjoined: each of the three PINNED conjuncts of
    # ('SalesAgreement','performed') survives character for character, moved inside a
    # `forall` over `/payload/obligation_refs`. records.schema.json declares that field an
    # array in `payload.required` with NO `minItems`, so `[]` is schema-valid and the
    # quantifier is vacuously true on such a record: the agreement need not name its
    # Fulfillment, that Fulfillment need not be `delivered`, no Obligation need be
    # `discharged` or `transferred`, and nothing need be natively correlated. The buyer
    # pays, the Fulfillment stays `proposed`, and the sale reaches `performed` -- G2-01's
    # counterexample, restored.
    #
    # Measured before the repair: author_phase_content.py regenerated cleanly and
    # validate_contracts.py exited 0 with 269,708 checks and 33 of 33 negative fixtures
    # still rejecting, with pinned-conjuncts.json, the fixtures and the `requires` prose
    # all untouched. Eleven checks MORE than the baseline -- the suite grew and said
    # nothing.
    #
    # r14-pinned-conjunct-disjoined-with-a-tautology cannot catch this: it walks the `any`
    # branch, and the walker that knew `any` had never heard of `forall`. If this fixture
    # ever passes validation again, the demand table has stopped being closed and a
    # non-demanding context is being walked as if it were `all`.
    ("SalesAgreement", "performed"): spec(
        "Performance of a sale is accepted delivery plus discharged or transferred "
        "obligations -- never payment alone. The agreement names its own Fulfillment "
        "record, that Fulfillment is currently `delivered`, and every linked Obligation "
        "is `discharged` or `transferred`. The correlated native object is the DELIVERY, "
        "not the charge: a settled payment is evidence about money and establishes "
        "nothing about whether the service arrived, so it moves the agreement to "
        "`accepted` or `partially-performed` and can never move it here.",
        ["c-fulfillment", "c-sales-outcome", "arch6-delivery", "arch3-outcome"],
        [("fa", "/payload/obligation_refs",
          ("every", [("nfp", ["/payload/fulfillment_ref", "/payload/obligation_refs",
                              "/payload/acceptance_evidence", "/payload/agreed_terms"]),
                     ("rpp", [("/payload/fulfillment_ref", ["delivered"], False),
                              ("/payload/obligation_refs", ["discharged", "transferred"],
                               False)]),
                     ("nc", "delivered")])),
         AF, AR],
        hard=["fa"]),

