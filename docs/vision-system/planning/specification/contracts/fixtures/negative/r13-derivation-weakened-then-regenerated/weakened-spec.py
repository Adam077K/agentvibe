    # THE MUTATION. This is the recheck's own hunk, kept verbatim in intent: the
    # ('SalesAgreement','performed') entry with `fulfillment_ref`, the phase bindings and
    # the delivery correlation all removed, leaving the pre-AD-013 body -- acceptance
    # evidence, agreed terms, and a correlation back to `performed`. The `requires`
    # sentence is left EXACTLY as it is, which is the sharpest part of the original
    # demonstration: the prose still promised delivery while the body stopped asking for
    # it, and nothing compared the two.
    #
    # Regenerating after this hunk was measured at exit 0, 268,829 checks, 27 of 27
    # negative fixtures still rejecting. If this fixture ever passes validation again,
    # the pin in contracts/pinned-conjuncts.json is gone and G2-01 is reintroducible.
    ("SalesAgreement", "performed"): spec(
        "Performance of a sale is accepted delivery plus discharged or transferred "
        "obligations -- never payment alone. The agreement names its own Fulfillment "
        "record, that Fulfillment is currently `delivered`, and every linked Obligation "
        "is `discharged` or `transferred`. The correlated native object is the DELIVERY, "
        "not the charge: a settled payment is evidence about money and establishes "
        "nothing about whether the service arrived, so it moves the agreement to "
        "`accepted` or `partially-performed` and can never move it here.",
        ["c-fulfillment", "c-sales-outcome", "arch6-delivery", "arch3-outcome"],
        [("nfp", ["/payload/acceptance_evidence", "/payload/agreed_terms"]),
         ("nc", "performed"), AF, AR],
        hard=["nfp", "nc"]),

