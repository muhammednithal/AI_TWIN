package workspace

import (
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestContextIncludesOnlyPinnedAndSelectedProjectMemories(t *testing.T) {
	project := Project{ID: uuid.New(), Name: "Research", Instructions: "Show uncertainty"}
	selected := uuid.New()
	pinned := uuid.New()
	now := time.Date(2026, 11, 3, 12, 0, 0, 0, time.UTC)
	notes := []ProjectMemory{{ID: selected, ProjectID: project.ID, Title: "Selected", Version: 2}, {ID: uuid.New(), ProjectID: project.ID, Title: "Unselected"}, {ID: pinned, ProjectID: project.ID, Title: "Constraint", Pinned: true, ReviewOn: "2026-11-02"}, {ID: uuid.New(), ProjectID: uuid.New(), Title: "Other project", Pinned: true}, {ID: uuid.New(), ProjectID: project.ID, Title: "Archived", Pinned: true, Archived: true}}
	context, err := buildContext(project, notes, TaskInput{Objective: "Compare options", Kind: "compare", MemoryIDs: []uuid.UUID{selected}}, now)
	if err != nil {
		t.Fatal(err)
	}
	if len(context.Memories) != 2 || context.Memories[0].ID != pinned || context.Memories[0].Reason != "pinned constraint" || context.Memories[1].ID != selected || context.Memories[1].Label != "M2" {
		t.Fatalf("unexpected selection: %+v", context.Memories)
	}
	if len(context.Warnings) != 1 || !strings.Contains(context.Warnings[0], "review date") {
		t.Fatal("missing freshness warning")
	}
	if context.Instructions != project.Instructions {
		t.Fatal("lost project constraints")
	}
}
func TestContextRejectsUnavailableSelectionAndOversizedConstraints(t *testing.T) {
	p := Project{ID: uuid.New()}
	archived := ProjectMemory{ID: uuid.New(), ProjectID: p.ID, Archived: true}
	foreign := ProjectMemory{ID: uuid.New(), ProjectID: uuid.New()}
	for _, id := range []uuid.UUID{archived.ID, foreign.ID, uuid.New(), uuid.Nil} {
		if _, err := buildContext(p, []ProjectMemory{archived, foreign}, TaskInput{MemoryIDs: []uuid.UUID{id}}, time.Now()); err == nil {
			t.Fatal("accepted unavailable memory")
		}
	}
	notes := []ProjectMemory{}
	for range 31 {
		notes = append(notes, ProjectMemory{ID: uuid.New(), ProjectID: p.ID, Pinned: true})
	}
	if _, err := buildContext(p, notes, TaskInput{}, time.Now()); err == nil {
		t.Fatal("silently dropped required context")
	}
}
func TestContextTokenDetectsChangedContentAndIsOrderIndependent(t *testing.T) {
	p := Project{ID: uuid.New(), Name: "Project"}
	a, b := uuid.New(), uuid.New()
	notes := []ProjectMemory{{ID: a, ProjectID: p.ID, Version: 1, Content: "A"}, {ID: b, ProjectID: p.ID, Version: 1, Content: "B"}}
	input := TaskInput{Objective: "Plan", Kind: "plan", MemoryIDs: []uuid.UUID{a, b}}
	api := &API{Secret: "test-secret"}
	first, err := buildContext(p, notes, input, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	input.MemoryIDs = []uuid.UUID{b, a}
	second, _ := buildContext(p, []ProjectMemory{notes[1], notes[0]}, input, time.Now())
	if api.contextToken(first) != api.contextToken(second) {
		t.Fatal("order changed the manifest")
	}
	notes[0].Content = "Updated"
	notes[0].Version++
	third, _ := buildContext(p, notes, input, time.Now())
	if api.contextToken(first) == api.contextToken(third) {
		t.Fatal("accepted changed evidence")
	}
	p.Instructions = "A new constraint"
	fourth, _ := buildContext(p, notes, input, time.Now())
	if api.contextToken(third) == api.contextToken(fourth) {
		t.Fatal("accepted changed instructions")
	}
}
func TestContextWithNoMemoriesIsExplicit(t *testing.T) {
	ctx, err := buildContext(Project{ID: uuid.New()}, nil, TaskInput{Objective: "Plan", Kind: "plan"}, time.Now())
	if err != nil || len(ctx.Memories) != 0 || len(ctx.Warnings) != 1 {
		t.Fatal("empty context must be explicit")
	}
}
