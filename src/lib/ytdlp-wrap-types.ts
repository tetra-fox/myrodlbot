import { ChildProcess } from "https://deno.land/x/std@0.128.0/node/internal/child_process.ts";
import { Readable } from "https://deno.land/x/std@0.128.0/node/stream.ts";

type YTDlpEventNameDataTypeMap = {
	close: [number | null];
	error: [Error];
	progress: [Progress];
	ytDlpEvent: [eventType: string, eventData: string];
};

type YTDlpEventName = keyof YTDlpEventNameDataTypeMap;

type YTDlpEventListener<EventName extends YTDlpEventName> = (
	...args: YTDlpEventNameDataTypeMap[EventName]
) => void;

type YTDlpEventNameToEventListenerFunction<ReturnType> = <
	K extends YTDlpEventName,
>(
	channel: K,
	listener: YTDlpEventListener<K>,
) => ReturnType;

type YTDlpEventNameToEventDataFunction<ReturnType> = <K extends YTDlpEventName>(
	channel: K,
	...args: YTDlpEventNameDataTypeMap[K]
) => ReturnType;

export type {
	YTDlpEventListener,
	YTDlpEventName,
	YTDlpEventNameDataTypeMap,
	YTDlpEventNameToEventDataFunction,
	YTDlpEventNameToEventListenerFunction,
};

export interface Progress {
	percent?: number;
	totalSize?: string;
	currentSpeed?: string;
	eta?: string;
}

type YTDlpReadableEventName = keyof YTDlpReadableEventNameDataTypeMap;

type YTDlpReadableEventListener<EventName extends YTDlpReadableEventName> = (
	...args: YTDlpReadableEventNameDataTypeMap[EventName]
) => void;

type YTDlpReadableEventNameToEventListenerFunction<ReturnType> = <
	K extends YTDlpReadableEventName,
>(
	event: K,
	listener: YTDlpReadableEventListener<K>,
) => ReturnType;

type YTDlpReadableEventNameToEventDataFunction<ReturnType> = <
	K extends YTDlpReadableEventName,
>(
	event: K,
	...args: YTDlpReadableEventNameDataTypeMap[K]
) => ReturnType;

type YTDlpReadableEventNameDataTypeMap = {
	close: [];
	progress: [progress: Progress];
	ytDlpEvent: [eventType: string, eventData: string];
	data: [chunk: any];
	end: [];
	error: [error: Error];
	pause: [];
	readable: [];
	resume: [];
};

export interface YTDlpReadable extends Readable {
	ytDlpProcess?: ChildProcess;

	/**
	 * Event emitter
	 * The defined events on documents including:
	 * 1. close
	 * 2. data
	 * 3. end
	 * 4. error
	 * 5. pause
	 * 6. readable
	 * 7. resume
	 * 8. ytDlpEvent
	 * 9. progress
	 */
	addListener: YTDlpReadableEventNameToEventListenerFunction<this>;
	emit: YTDlpReadableEventNameToEventDataFunction<boolean>;
	on: YTDlpReadableEventNameToEventListenerFunction<this>;
	once: YTDlpReadableEventNameToEventListenerFunction<this>;
	prependListener: YTDlpReadableEventNameToEventListenerFunction<this>;
	prependOnceListener: YTDlpReadableEventNameToEventListenerFunction<this>;
	removeListener: YTDlpReadableEventNameToEventListenerFunction<this>;
}
