// This file provides polyfills for Node.js globals that are used by some libraries
// but are not available in the browser environment

// Polyfill for global
if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}

// Polyfill for process
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {},
    nextTick: function(cb) {
      setTimeout(cb, 0);
    },
    browser: true
  };
}

// Polyfill for Buffer
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = {
    isBuffer: function() {
      return false;
    }
  };
}
