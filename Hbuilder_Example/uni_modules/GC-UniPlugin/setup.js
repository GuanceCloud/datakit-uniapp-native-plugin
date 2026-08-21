import {
	mobileAgent,
	rum,
	logger,
	tracer
} from '@/uni_modules/GC-UniPlugin'
import {
	installNativeBridge
} from '@/uni_modules/GC-JSPlugin'

// This side-effect entry is the UTS composition root. Applications import it
// once before their first GC-JSPlugin collector call.
installNativeBridge({
	mobileAgent,
	rum,
	logger,
	tracer
}, {
	source: 'uts'
})
