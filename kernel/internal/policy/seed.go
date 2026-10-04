package policy

// seedRows is the seed decision-rights matrix: docs/vision-v3/05-AUTONOMY-INITIATIVE-FOUNDER.md §5,
// compiled into the Kernel because it never reads a doc at runtime. TestB1_14a_SeedRightsEveryCell
// reads §5 and compares every cell, so an edit to the doc moves this table or fails that test.
// Cells the doc leaves empty are omitted; a cell with no levels holds its right at every level.
var seedRows = []DecisionRow{
	{Num: 1, Name: "Constitution content", EnforcedBy: "Passkey-only store", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Decides)),
		CoFounder:  cell("", lr(Propose)),
		Shadow:     cell("", lr(Propose)),
		Acceptance: cell("", lr(Inform)),
		Custody:    cell("", lr(Execute)),
		Regulation: cell("", lr(Propose)),
	}},
	{Num: 2, Name: "Demote a level; throttle initiative", EnforcedBy: "Compiler flags", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Inform)),
		CoFounder:  cell("", lr(Propose)),
		Shadow:     cell("", lr(Propose)),
		Acceptance: cell("", lr(Inform)),
		Custody:    cell("", lr(Execute)),
		Regulation: cell("", lr(Decides)),
	}},
	{Num: 3, Name: "Venture intent (root goal)", EnforcedBy: "Charter signature", Cells: map[Holder]Cell{
		Founder:   cell("", lr(Decides)),
		CoFounder: cell("", lr(Propose)),
		Shadow:    cell("", lr(Veto)),
	}},
	{Num: 4, Name: "Goal tree below intent (strategy inside existing intent; each node classed core / speculative with its cap)", EnforcedBy: "Admission code; exceeding a cap needs a signed widening", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Decides, "A0", "A1", "A2", "A3")),
		CoFounder:  cell("", lr(Decides, "A4"), lr(Propose, "A3")),
		Shadow:     cell(">30% speculative; survives a founder overrule", lr(Veto)),
		Acceptance: cell("", lr(Inform)),
	}},
	{Num: 5, Name: "Theses, bets, kill criteria; kill on date", EnforcedBy: "Admission code", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Veto)),
		CoFounder:  cell("", lr(Decides)),
		Shadow:     cell("", lr(Propose)),
		Allocation: cell("", lr(Execute)),
		Acceptance: cell("", lr(Inform)),
		Record:     cell("", lr(Inform)),
	}},
	{Num: 6, Name: "Open an investment mission", EnforcedBy: "Admission gate", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Decides, "A0", "A1")),
		CoFounder:  cell("", lr(Decides, "A2", "A3", "A4")),
		Allocation: cell("", lr(Execute)),
		Regulation: cell("", lr(Veto)),
	}},
	{Num: 7, Name: "Size, order, fund tranches", EnforcedBy: "Allocator", Cells: map[Holder]Cell{
		Founder:    cell("envelope", lr(Veto)),
		CoFounder:  cell("", lr(Propose)),
		Allocation: cell("", lr(Decides)),
		Regulation: cell("", lr(Veto)),
	}},
	{Num: 8, Name: "Obligations-lane work", EnforcedBy: "Reserve order", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Inform)),
		CoFounder:  cell("", lr(Inform)),
		Allocation: cell("", lr(Decides)),
		Execution:  cell("", lr(Execute)),
		Custody:    cell("", lr(Execute)),
	}},
	{Num: 9, Name: "Budget envelope across ventures", EnforcedBy: "ceilings.yml", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Decides)),
		CoFounder:  cell("", lr(Propose)),
		Allocation: cell("", lr(Execute)),
		Regulation: cell("", lr(Veto)),
	}},
	{Num: 10, Name: "Mission shape, team, family", EnforcedBy: "Launcher, tool leases", Cells: map[Holder]Cell{
		CoFounder:  cell("", lr(Propose)),
		Allocation: cell("", lr(Veto)),
		Execution:  cell("", lr(Decides)),
		Acceptance: cell("coverage", lr(Veto)),
	}},
	{Num: 11, Name: "Merge to main", EnforcedBy: "Integration queue", Cells: map[Holder]Cell{
		Execution:  cell("", lr(Propose)),
		Acceptance: cell("", lr(Decides)),
	}},
	{Num: 12, Name: "Accept; settle a Closer Claim or wager", EnforcedBy: "Parsed verdict (DR-13)", Cells: map[Holder]Cell{
		CoFounder:  cell("", lr(Propose)),
		Execution:  cell("", lr(Propose)),
		Acceptance: cell("", lr(Decides)),
		Record:     cell("", lr(Inform)),
	}},
	{Num: 13, Name: "Promote a deposit to a Brain fact", EnforcedBy: "Sleep gate", Cells: map[Holder]Cell{
		CoFounder:  cell("", lr(Propose)),
		Execution:  cell("", lr(Propose)),
		Acceptance: cell("", lr(Veto)),
		Record:     cell("", lr(Decides)),
	}},
	{Num: 14, Name: "Declare incident; issue incident grant", EnforcedBy: "Kernel record", Cells: map[Holder]Cell{
		Founder:    cell("Halt", lr(Inform)),
		CoFounder:  cell("", lr(Propose)),
		Execution:  cell("", lr(Propose)),
		Custody:    cell("", lr(Execute)),
		Regulation: cell("", lr(Decides)),
	}},
	{Num: 15, Name: "Kill, pivot (new intent = new Charter) or persist a venture", EnforcedBy: "Charter signature; line 5 (DR-66)", Cells: map[Holder]Cell{
		Founder:    cell("passkey only; never silence", lr(Decides)),
		CoFounder:  cell("must pick", lr(Propose)),
		Shadow:     cell("", lr(Propose)),
		Allocation: cell("", lr(Execute)),
		Acceptance: cell("", lr(Inform)),
		Custody:    cell("", lr(Execute)),
		Regulation: cell("", lr(Propose)),
	}},
	{Num: 16, Name: "Two-way external effect in grants", EnforcedBy: "Decision Contract", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Inform)),
		CoFounder:  cell("", lr(Decides)),
		Execution:  cell("", lr(Propose)),
		Custody:    cell("", lr(Execute)),
		Regulation: cell("", lr(Veto)),
	}},
	{Num: 17, Name: "Pre-listed one-way door", EnforcedBy: "Decision Contract", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Inform)),
		CoFounder:  cell("", lr(Decides, "A3", "A4"), lr(Propose, "A0", "A1", "A2")),
		Shadow:     cell("", lr(Veto)),
		Execution:  cell("", lr(Propose)),
		Acceptance: cell("", lr(Veto)),
		Custody:    cell("", lr(Execute)),
		Regulation: cell("", lr(Veto)),
	}},
	{Num: 18, Name: "Non-listed one-way door", EnforcedBy: "ask / co-sign", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Decides)),
		CoFounder:  cell("", lr(Propose)),
		Shadow:     cell("", lr(Propose)),
		Acceptance: cell("", lr(Veto)),
		Custody:    cell("", lr(Execute)),
		Regulation: cell("", lr(Veto)),
	}},
	{Num: 19, Name: "Never-list act", EnforcedBy: "P1", Cells: map[Holder]Cell{
		Founder:   cell("human act", lr(Decides)),
		CoFounder: cell("", lr(Propose)),
		Shadow:    cell("", lr(Propose)),
		Custody:   cell("else refuses", lr(Execute)),
	}},
	{Num: 20, Name: "Promote trust rung, SO, level, bench seat", EnforcedBy: "Cooling-off", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Decides)),
		CoFounder:  cell("", lr(Propose)),
		Shadow:     cell("", lr(Propose)),
		Acceptance: cell("", lr(Inform)),
		Regulation: cell("", lr(Veto)),
	}},
	{Num: 21, Name: "Procure a human task in signed terms", EnforcedBy: "Human Task Market", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Inform)),
		CoFounder:  cell("", lr(Decides)),
		Allocation: cell("", lr(Execute)),
		Execution:  cell("", lr(Propose)),
		Acceptance: cell("", lr(Veto)),
		Custody:    cell("", lr(Execute)),
		Regulation: cell("classification", lr(Veto)),
	}},
	{Num: 22, Name: "Restart after trip or incident", EnforcedBy: "Restart record (DR-27)", Cells: map[Holder]Cell{
		Founder:    cell("", lr(Inform)),
		CoFounder:  cell("", lr(Inform)),
		Execution:  cell("", lr(Propose)),
		Acceptance: cell("safe envelope", lr(Veto)),
		Custody:    cell("", lr(Execute)),
		Regulation: cell("", lr(Decides)),
	}},
}

// lr is one part of a cell: right r at levels, every level when none are named.
func lr(r Right, levels ...Level) LevelRight { return LevelRight{Right: r, Levels: levels} }

// cell is one holder's entry: its parts and the parenthetical note.
func cell(note string, parts ...LevelRight) Cell { return Cell{Rights: parts, Note: note} }

// SeedRights returns the seed matrix: 05 §5, compiled into the Kernel. It never reads a file at
// runtime (orchestrator ruling R1, 2026-10-03).
func SeedRights() (*Rights, error) { return NewRights(seedRows) }
