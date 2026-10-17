//! RISKOS Lock-Free Single-Producer Single-Consumer (SPSC) Bounded Queue in Rust
//! High-throughput ring buffer utilizing atomic acquire/release memory semantics
//! Cacheline-padded to eliminate CPU false sharing between threads.

use std::sync::atomic::{AtomicUsize, Ordering};
use std::cell::UnsafeCell;

const CACHELINE_BYTES: usize = 64;

#[repr(align(64))]
pub struct SpscQueue<T, const CAP: usize> {
    buffer: [UnsafeCell<Option<T>>; CAP],
    tail: AtomicUsize, // Written by producer
    _pad1: [u8; CACHELINE_BYTES - std::mem::size_of::<AtomicUsize>()],
    head: AtomicUsize, // Written by consumer
    _pad2: [u8; CACHELINE_BYTES - std::mem::size_of::<AtomicUsize>()],
}

unsafe impl<T: Send, const CAP: usize> Sync for SpscQueue<T, CAP> {}
unsafe impl<T: Send, const CAP: usize> Send for SpscQueue<T, CAP> {}

impl<T, const CAP: usize> SpscQueue<T, CAP> {
    pub fn new() -> Self {
        assert!(CAP.is_power_of_two(), "Capacity must be a power of two");
        assert!(CAP >= 2, "Capacity must be at least 2");

        // Initialize array of UnsafeCell<Option<T>>
        let buffer = std::array::from_fn(|_| UnsafeCell::new(None));

        Self {
            buffer,
            tail: AtomicUsize::new(0),
            _pad1: [0u8; CACHELINE_BYTES - std::mem::size_of::<AtomicUsize>()],
            head: AtomicUsize::new(0),
            _pad2: [0u8; CACHELINE_BYTES - std::mem::size_of::<AtomicUsize>()],
        }
    }

    /// Enqueue an item into the queue (Producer only)
    pub fn push(&self, item: T) -> Result<(), T> {
        let tail = self.tail.load(Ordering::Relaxed);
        let head = self.head.load(Ordering::Acquire);

        if tail.wrapping_sub(head) >= CAP {
            return Err(item); // Full
        }

        let mask = CAP - 1;
        unsafe {
            *self.buffer[tail & mask].get() = Some(item);
        }

        self.tail.store(tail.wrapping_add(1), Ordering::Release);
        Ok(())
    }

    /// Dequeue an item from the queue (Consumer only)
    pub fn pop(&self) -> Option<T> {
        let head = self.head.load(Ordering::Relaxed);
        let tail = self.tail.load(Ordering::Acquire);

        if head == tail {
            return None; // Empty
        }

        let mask = CAP - 1;
        let item = unsafe { (*self.buffer[head & mask].get()).take() };

        self.head.store(head.wrapping_add(1), Ordering::Release);
        item
    }

    /// Check if queue is empty
    pub fn is_empty(&self) -> bool {
        self.head.load(Ordering::Relaxed) == self.tail.load(Ordering::Relaxed)
    }

    /// Current approximate size
    pub fn len(&self) -> usize {
        let head = self.head.load(Ordering::Relaxed);
        let tail = self.tail.load(Ordering::Relaxed);
        tail.wrapping_sub(head)
    }
}
