export const vibrateDecorator = (callback: (...args: any) => any) => {
	return (...args: any): any => {
		try {
			navigator.vibrate(200);
		}
		catch (err) { }
		return callback(...args);
	};
};
