const addMessage = (msg, state) => {

	state.setActiveMessages(prev => [...prev, msg]);

	setTimeout(() => {
		state.setActiveMessages(prev => prev.slice(0, prev.length-1));
	}, 2000);
}
export default addMessage;

