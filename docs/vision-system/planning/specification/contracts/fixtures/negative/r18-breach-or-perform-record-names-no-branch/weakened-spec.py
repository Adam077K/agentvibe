    # THE MUTATION (F6C-02). The ExhaustionDecision spec, weakened exactly where the
    # finding bites: `/payload/branch` and `/payload/reason` removed from the conjunct,
    # and the `rpp` row on the route dropped. The `requires` sentence is left EXACTLY as
    # it is, which is the sharpest part of the demonstration -- the prose still promises
    # that the record names which branch was chosen and why while the body stops asking
    # for either, and the criterion-content oracle compares the registry to THIS file, so
    # regenerating makes the two agree again.
    #
    # What refuses it is contracts/pinned-conjuncts.json, which is hand-written and which
    # author_phase_content.py neither reads nor writes. If this fixture ever passes, the
    # breach-or-perform record is back to being a record that need not say what was
    # decided, which is the state F6C-02 found the package in with no record at all.
    ("ExhaustionDecision", "written"): spec(
        'The due obligation, the window, the branch taken, the route it was taken by, the '
        'recipient who was alerted and the reason are all recorded, and the proposing and '
        'authorising components are named. Neither branch is silent and neither branch is '
        'automatic, so the record exists whichever was chosen; the route is an assignment '
        'that is currently accepted, because a route nobody holds is not a route.',
        ['c-ed-written', 'c-ed-route'],
        [('nfp', ['/payload/obligation_ref', '/payload/window', '/payload/route_ref', '/payload/alerted_recipient_ref', '/payload/proposing_component_id', '/payload/authorising_component_id']), AR],
        hard=['nfp']),

