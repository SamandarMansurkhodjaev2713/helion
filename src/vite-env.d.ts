/// <reference types="vite/client" />

import 'react'

declare module 'react' {
  interface HTMLAttributes<T> {
    /**
     * Removes a subtree from the tab order, hit testing and the accessibility
     * tree in one move — the correct way to park an off-screen overlay.
     *
     * React 18's typings predate the attribute (it lands in the React 19 types),
     * so it is declared here. Pass `''` to switch it on and `undefined` to omit
     * the attribute entirely; `inert` is boolean by presence, and React 18 warns
     * when a non-boolean attribute receives `true`.
     */
    inert?: '' | undefined
  }
}
