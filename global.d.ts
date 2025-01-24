// globals.d.ts
declare module "eventsource" {
    interface Event {
        cancelBubble: () => void;
    }
}
