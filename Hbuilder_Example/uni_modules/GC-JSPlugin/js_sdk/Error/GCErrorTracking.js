/**
 * Error information collection module
 * Responsible for capturing console.error and uni.onError errors
 */
const EMPTY_MESSAGE = 'Unknown Error';
const CONSOLE_ERROR = "console_error";
const rum = uni.requireNativePlugin("GCUniPlugin-RUM");
// Application state management - initially in startup state
let appState = 'startup';

// Monitor application show/hide state changes
function setupAppStateTracking() {
  // Listen for application show event
  uni.onAppShow(() => {
    appState = 'run';
  });
  
  // Listen for application hide event
  uni.onAppHide(() => {
    appState = 'unknown';
  });
}

export const gcErrorTracking = {
	isTracking: false,
	/**
	 * Initialize error collection
	 */
	startTracking() {
		if (this.isTracking) {
			console.log('Error tracking is already active');
			return;
		}
		setupAppStateTracking();
		
		// Capture console.error
		this.captureConsoleError();

		// Capture uni.onError
		this.captureUniError();

		this.isTracking = true;
		console.log('Error tracking started successfully');
	},

	/**
	 * Capture console.error errors
	 */
	captureConsoleError() {
		const originalConsoleError = console.error;

		console.error = function(...args) {
			// Call the original method to ensure errors are normally output to the console
			originalConsoleError.apply(console, args);

			// Process error information
			try {
				const errorInfo = {
					type: CONSOLE_ERROR,
					message: this.getErrorMessage(args[0]),
					stack: this.getErrorStackTrace(args[0]),
					state: appState,
				};

				// Report error information
				this.reportError(errorInfo);
			} catch (e) {
				originalConsoleError('An exception occurred during error collection:', e);
			}
		}.bind(this);
	},

	/**
	 * Capture uni.onError errors
	 */
	captureUniError() {
		uni.onError((error) => {
			try {
				const errorInfo = {
					message: this.getErrorMessage(error),
					stack: this.getErrorStackTrace(error),
					state: appState,
				};

				// Report error information
				this.reportError(errorInfo);
			} catch (e) {
				console.error('An exception occurred during uni error collection:', e);
			}
		});
	},

	/**
	 * Report error information
	 * @param {Object} errorInfo - Error information object
	 */
	reportError(errorInfo) {
		console.log('Error captured, ready to report:', errorInfo);
		if(rum){
		  rum.addError(errorInfo);
		}
	},

	/**
	 * Get error message
	 * @param {any} error - Error object or information
	 * @returns {string} Error message
	 */
	getErrorMessage(error) {
		let message = EMPTY_MESSAGE;
		if (error === undefined || error === null) {
			message = EMPTY_MESSAGE;
		} else if (typeof error === 'object' && 'message' in error) {
			message = String(error.message);
		} else {
			message = String(error);
		}
		return message;
	},

	/**
	 * Get error stack trace
	 * @param {any} error - Error object or information
	 * @returns {string} Error stack trace
	 */
	getErrorStackTrace(error) {
		let stack = '';
		if (error === undefined) {
			stack = '';
		} else if (typeof error === 'string') {
			stack = '';
		} else if ('componentStack' in error) {
			stack = String(error.componentStack);
		} else if ('stacktrace' in error) {
			stack = String(error.stacktrace);
		} else if ('stack' in error) {
			stack = String(error.stack);
		} else if (('sourceURL' in error) && ('line' in error) && ('column' in error)) {
			stack = `at ${error.sourceURL}:${error.line}:${error.column}`;
		}
		return stack;
	}
};