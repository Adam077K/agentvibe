module example.com/fixture/disallowed

go 1.25

require example.com/evil v0.0.0

// A directory replace keeps the fixture offline. It is also a violation of its own, which is what
// TestModulesReplacedModuleFailsEvenWhenAllowed pins.
replace example.com/evil => ./evil
