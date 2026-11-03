/** Local-only, disposable project/task fixtures. No model calls or persistent data. */
import { createHash, randomUUID } from 'node:crypto';
export function createWorkbenchFixtures() {
 const now = () => new Date().toISOString();
 let projects = [{ id: randomUUID(), name: 'Build something useful', purpose: 'Turn user research and product constraints into practical next steps.', instructions: 'Distinguish evidence from assumptions. Prefer a useful small step over a large speculative plan.', archived: false, created_at: now(), updated_at: now() }];
 let memories = [
  { id: randomUUID(), project_id: projects[0].id, title: 'Keep the first version focused', kind: 'instruction', content: 'Start with one workflow and make it useful end to end before expanding.', pinned: true, source: 'My product constraint', tags: 'scope, product', archived: false, review_on: '', version: 1, created_at: now(), updated_at: now() },
  { id: randomUUID(), project_id: projects[0].id, title: 'Context should be visible', kind: 'research', content: 'People want to know which saved memories informed a result, and they want to correct them.', pinned: false, source: 'Synthetic research for local preview', tags: 'research', archived: false, review_on: '2026-11-01', version: 1, created_at: now(), updated_at: now() },
  { id: randomUUID(), project_id: projects[0].id, title: 'A practical writing preference', kind: 'preference', content: 'Use clear explanations, concrete next steps, and a calm tone.', pinned: false, source: 'My preference', tags: 'communication', archived: false, review_on: '', version: 1, created_at: now(), updated_at: now() },
 ];
 let tasks = []; let decisions = [];
 const snapshot = (p, input) => {
  const selected = memories.filter(m => m.project_id === p.id && !m.archived && (m.pinned || input.memory_ids?.includes(m.id))).sort((a,b) => Number(b.pinned)-Number(a.pinned) || a.id.localeCompare(b.id));
  const context = { prompt_version: 1, project_id: p.id, project_name: p.name, purpose: p.purpose, instructions: p.instructions, objective: input.objective?.trim(), kind: input.kind, memories: selected.map((m,i) => ({ id:m.id,label:`M${i+1}`,title:m.title,kind:m.kind,content:m.content,source:m.source,source_task_id:m.source_task_id,version:m.version,reason:m.pinned?'pinned constraint':'selected',review_on:m.review_on,updated_at:m.updated_at })), warnings: selected.filter(m => m.review_on && m.review_on <= now().slice(0,10)).map(m => `${m.title}: review date reached; verify this memory is still accurate.`) };
  if (!selected.length) context.warnings.push('No memories selected. Project brief only.');
  return { context, preview_token:createHash('sha256').update(JSON.stringify(context)).digest('hex') };
 };
 return {
  export: () => ({ projects, project_memories:memories, tasks, decisions }),
  handle(req, url, input, send, legacy = {}) {
   const reply = (body,status=200) => { send(body,status); return true; }; const parts=url.pathname.split('/'); const id=parts[3]; const child=parts[4]; const childId=parts[5];
   if (url.pathname === '/api/decisions') return reply({ decisions:decisions.filter(d => !url.searchParams.get('project_id') || d.project_id===url.searchParams.get('project_id')) });
   if (parts[2] === 'tasks') {
    if (!id) return reply({ tasks:tasks.filter(t => !url.searchParams.get('project_id') || t.project_id===url.searchParams.get('project_id')).map(({result:_r,context_snapshot:_s,...t})=>t) });
    const task=tasks.find(t=>t.id===id);if(!task)return reply({error:'Task not found.'},404);
    if(child==='review' && req.method==='PUT'){task.status=input.status;task.review_notes=input.review_notes;task.updated_at=now();}
    return reply({task});
   }
   if(parts[2]!=='projects')return false;
   if(!id){if(req.method==='GET')return reply({projects:projects.map(p=>({...p,memory_count:memories.filter(m=>m.project_id===p.id&&!m.archived).length,task_count:tasks.filter(t=>t.project_id===p.id).length}))});const project={...input,id:randomUUID(),created_at:now(),updated_at:now(),memory_count:0,task_count:0};projects.unshift(project);return reply({project});}
   const project=projects.find(p=>p.id===id);if(!project)return reply({error:'Project not found.'},404);
   if(!child){if(req.method==='PUT')Object.assign(project,input,{updated_at:now()});return reply({project});}
   if(child==='memories'){
    if(req.method==='GET')return reply({memories:memories.filter(m=>m.project_id===id)});
    if(project.archived)return reply({error:'Restore the project before making changes.'},409);
    const old=memories.find(m=>m.id===childId&&m.project_id===id);if(childId&&!old)return reply({error:'Memory not found.'},404);
    const memory={...input,id:childId||randomUUID(),project_id:id,version:(old?.version||0)+1,created_at:old?.created_at||now(),updated_at:now()};memories=[memory,...memories.filter(m=>m.id!==memory.id)];return reply({memory});
   }
   if(project.archived)return reply({error:'Restore the project before making changes.'},409);
   if(child==='import-twin-memories'){
    let imported=0;for(const row of legacy.memories||[]){if(row.personality_id!==input.twin_id||!input.memory_ids.includes(row.id))continue;const key=`import-${id}-${row.id}`;if(memories.some(m=>m.id===key))continue;memories.push({id:key,project_id:id,title:row.content.slice(0,110),content:row.content,kind:input.kind,tags:row.tags||'',source:'Imported twin memory (fixture)',pinned:false,archived:false,review_on:'',version:1,created_at:now(),updated_at:now()});imported++;}return reply({imported,already_present_or_empty:input.memory_ids.length-imported});
   }
   if(child==='context')return reply(snapshot(project,input));
   if(child==='tasks'){
    const existing=tasks.find(t=>t.request_id===input.request_id);if(existing)return reply({task:existing});
    if(input.objective?.includes('[fail]'))return reply({error:'Simulated provider failure. Nothing was saved.'},502);
    const preview=snapshot(project,input);if(preview.preview_token!==input.preview_token)return reply({error:'Context changed. Preview again.'},409);
    const task={id:randomUUID(),project_id:id,request_id:input.request_id,objective:input.objective,kind:input.kind,context_count:preview.context.memories.length,status:'needs_review',review_notes:'',context_snapshot:structuredClone(preview.context),result:'## Result\nThis is a **disposable preview result**, not a live AI analysis.\n\nStart with a focused workflow that connects saved context to a reviewable result.\n\n## Context applied\n'+preview.context.memories.map(m=>`- [${m.label}] ${m.title}`).join('\n')+'\n\n## Assumptions & missing information\nNo external research was performed. Validate the assumptions with real users.\n\n## Next steps\n1. Choose one useful question.\n2. Review the context.\n3. Record your decision and revisit the outcome.',created_at:now(),updated_at:now()};tasks.unshift(task);return reply({task},201);
   }
   if(child==='decisions'){const old=decisions.find(d=>d.id===childId&&d.project_id===id);const decision={...input,id:childId||randomUUID(),project_id:id,created_at:old?.created_at||now(),updated_at:now()};decisions=[decision,...decisions.filter(d=>d.id!==decision.id)];return reply({decision});}
   return reply({error:'Fixture route not found.'},404);
  },
 };
}
