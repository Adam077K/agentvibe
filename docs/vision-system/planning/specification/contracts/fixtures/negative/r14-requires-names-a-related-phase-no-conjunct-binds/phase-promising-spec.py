    # THE MUTATION, and it is one CLAUSE of prose: the conjuncts are untouched, so every
    # pin on this criterion still passes, and `requires` gains a promise about a phase of
    # a RELATED record -- Fulfillment's `refunded` -- that no `related_phases` binding
    # holds. The sentence tells a reader that reaching `performed` rules out a refund. The
    # body says nothing about refunds at all.
    #
    # It sits in the DERIVATION rather than in the registry so that regenerating produces
    # a tree the drift oracle is happy with, which is the only shape in which the
    # requires/conjuncts comparison is the single thing left that can object.
    #
    # This is the PHASES half of RC-03, and it had no fixture until RC2-03. The half that
    # did -- r13-requires-promises-what-the-body-does-not-demand, the field-path rule --
    # has an applicable population of ZERO on the committed corpus: 0 of 774 `requires`
    # sentences name a field path. So the only half of RC-03 carrying live force was the
    # half with no negative control, and a rule with no population and no control is two
    # ways of being unable to tell whether it still works.
    ("SalesAgreement", "performed"): spec(
        "Performance of a sale is accepted delivery plus discharged or transferred "
        "obligations -- never payment alone. The agreement names its own Fulfillment "
        "record, that Fulfillment is currently `delivered` and has not been `refunded`, "
        "and every linked Obligation is `discharged` or `transferred`. The correlated "
        "native object is the DELIVERY, not the charge: a settled payment is evidence "
        "about money and establishes nothing about whether the service arrived, so it "
        "moves the agreement to `accepted` or `partially-performed` and can never move "
        "it here.",
        ["c-fulfillment", "c-sales-outcome", "arch6-delivery", "arch3-outcome"],
        [("nfp", ["/payload/fulfillment_ref", "/payload/obligation_refs",
                  "/payload/acceptance_evidence", "/payload/agreed_terms"]),
         ("rpp", [("/payload/fulfillment_ref", ["delivered"], False),
                  ("/payload/obligation_refs", ["discharged", "transferred"], False)]),
         ("nc", "delivered"), AF, AR],
        hard=["nfp", "rpp", "nc"]),

