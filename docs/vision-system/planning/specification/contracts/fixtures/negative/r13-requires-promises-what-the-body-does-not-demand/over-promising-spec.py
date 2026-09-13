    # THE MUTATION, and it is one sentence of PROSE: the conjuncts are left exactly as
    # they are and `requires` gains a promise about `/payload/payment_operation`, which
    # no conjunct reads. It is patched into the DERIVATION rather than into the registry
    # so that regenerating produces a tree the drift oracle is happy with -- which is
    # the shape RC-03 describes, and the only shape in which nothing but the
    # requires/conjuncts comparison can object.
    ("SalesAgreement", "performed"): spec(
        "Performance of a sale is accepted delivery plus discharged or transferred "
        "obligations -- never payment alone. The agreement names its own Fulfillment "
        "record, that Fulfillment is currently `delivered`, and every linked Obligation "
        "is `discharged` or `transferred`. The correlated native object is the DELIVERY, "
        "not the charge: a settled payment is evidence about money and establishes "
        "nothing about whether the service arrived, so it moves the agreement to "
        "`accepted` or `partially-performed` and can never move it here."
        " The settled charge behind `/payload/payment_operation` is recorded and "
        "reconciled against the delivery.",
        ["c-fulfillment", "c-sales-outcome", "arch6-delivery", "arch3-outcome"],
        [("nfp", ["/payload/fulfillment_ref", "/payload/obligation_refs",
                  "/payload/acceptance_evidence", "/payload/agreed_terms"]),
         ("rpp", [("/payload/fulfillment_ref", ["delivered"], False),
                  ("/payload/obligation_refs", ["discharged", "transferred"], False)]),
         ("nc", "delivered"), AF, AR],
        hard=["nfp", "rpp", "nc"]),

