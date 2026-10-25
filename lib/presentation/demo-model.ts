// Presentation fixtures only. This module has no authentication, network or database access.
export type DemoRole = 'Client' | 'Staff' | 'Admin';
export type DemoStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
export type DemoMessage = { author: string; role: DemoRole; text: string };
export type DemoTicket = { id: number; title: string; priority: 'Low' | 'Medium' | 'High'; status: DemoStatus; description: string; messages: DemoMessage[]; history: string[]; solution: string };
export type DemoState = { tickets: DemoTicket[]; selected: number; notice: string };
export type DemoAction =
  | { type: 'select'; id: number }
  | { type: 'reset' }
  | { type: 'create'; title: string; description: string; priority: DemoTicket['priority'] }
  | { type: 'reply'; role: DemoRole; text: string }
  | { type: 'assign' | 'start' | 'accept'; role: DemoRole }
  | { type: 'resolve'; role: DemoRole; text: string };

export function initialDemo(): DemoState {
  return { selected: 1042, notice: '', tickets: [
    { id: 1042, title: 'Help with company access', priority: 'High', status: 'Open', description: 'I can sign in, but I cannot see our shared project workspace. Could you check my company access?', messages: [{ author: 'Alex Morgan', role: 'Client', text: 'The workspace should be Northstar Studio. I joined the team this morning.' }], history: ['Alex opened this request.'], solution: '' },
    { id: 1041, title: 'Project file review', priority: 'Medium', status: 'In Progress', description: 'Please review the handover checklist for our client portal project.', messages: [{ author: 'Sam Rivera', role: 'Staff', text: 'The checklist is attached to the project. I am reviewing the remaining items.' }], history: ['Alex opened this request.', 'Sam was assigned as the responsible staff member.', 'Sam started work.'], solution: '' },
    { id: 1038, title: 'Notification preferences', priority: 'Low', status: 'Closed', description: 'I need help finding the notification settings.', messages: [{ author: 'Alex Morgan', role: 'Client', text: 'I found the settings and confirmed that everything works. Thank you.' }], history: ['Alex opened this request.', 'Sam proposed a solution.', 'Alex accepted the solution. Ticket closed.'], solution: 'Open your account settings to review the available preferences.' },
  ] };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === 'reset') return initialDemo();
  if (action.type === 'select') return state.tickets.some(t => t.id === action.id) ? { ...state, selected: action.id, notice: '' } : state;
  if (action.type === 'create') {
    const title = action.title.trim(), description = action.description.trim();
    if (title.length < 5 || title.length > 100 || description.length < 10 || description.length > 1500 || state.tickets.length >= 20 || !['Low', 'Medium', 'High'].includes(action.priority)) return state;
    const id = Math.max(...state.tickets.map(t => t.id)) + 1;
    return { selected: id, notice: 'Demo ticket created. Switch to Staff to work on it.', tickets: [{ id, title, description, priority: action.priority, status: 'Open', messages: [], history: ['Alex opened this request.'], solution: '' }, ...state.tickets] };
  }
  const ticket = state.tickets.find(t => t.id === state.selected);
  if (!ticket || ticket.status === 'Closed') return state;
  let updated = ticket, notice = '';
  if (action.type === 'reply') {
    const text = action.text.trim();
    if (!['Client', 'Staff'].includes(action.role) || !text || text.length > 1500 || ticket.messages.length >= 30) return state;
    const author = action.role === 'Client' ? 'Alex Morgan' : 'Sam Rivera';
    updated = { ...ticket, messages: [...ticket.messages, { author, role: action.role, text }], history: [...ticket.history, `${author} added a reply.`] };
    notice = 'Reply added to this demo conversation.';
  } else if (action.type === 'assign' && action.role === 'Staff' && ticket.status === 'Open') {
    updated = { ...ticket, status: 'Assigned', history: [...ticket.history, 'Sam was assigned as the responsible staff member.'] }; notice = 'Assigned to Sam. You can now start work.';
  } else if (action.type === 'start' && action.role === 'Staff' && ticket.status === 'Assigned') {
    updated = { ...ticket, status: 'In Progress', history: [...ticket.history, 'Sam started work.'] }; notice = 'Work is in progress. Reply or propose a solution.';
  } else if (action.type === 'resolve' && action.role === 'Staff' && ticket.status === 'In Progress') {
    const text = action.text.trim(); if (text.length < 10 || text.length > 1500) return state;
    updated = { ...ticket, status: 'Resolved', solution: text, history: [...ticket.history, 'Sam proposed a solution for client review.'] }; notice = 'Solution proposed. Switch to Client to review and accept it.';
  } else if (action.type === 'accept' && action.role === 'Client' && ticket.status === 'Resolved') {
    updated = { ...ticket, status: 'Closed', history: [...ticket.history, 'Alex accepted the solution. Ticket closed.'] }; notice = 'Ticket closed. Its conversation and history are preserved in this demo.';
  }
  return updated === ticket ? state : { ...state, notice, tickets: state.tickets.map(t => t.id === updated.id ? updated : t) };
}
