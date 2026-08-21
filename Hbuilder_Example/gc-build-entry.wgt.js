export {
	logger,
	mobileAgent,
	rum,
	tracer
} from '@/uni_modules/GC-JSPlugin'

// A UniMP host owns native SDK initialization. The WGT only collects JS data
// and calls host-provided APIs through the GC-JSPlugin compatibility facade.
export function initializeGuanceSDK() {}
