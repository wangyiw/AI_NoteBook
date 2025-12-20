import '@testing-library/jest-dom/vitest'

// jsdom 环境下补齐 requestAnimationFrame，避免组件里用到时挂掉
if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
        return window.setTimeout(() => cb(performance.now()), 0)
    }
}

if (!globalThis.cancelAnimationFrame) {
    globalThis.cancelAnimationFrame = (id: number) => {
        window.clearTimeout(id)
    }
}
