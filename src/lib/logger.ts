import dayjs from 'dayjs';
import debugFactory from 'debug';
import Logger from 'js-logger';

const getTimestamp = () => dayjs().format('YYYY-MM-DDTHH:mm:ssZ[Z]');

const log_O = debugFactory.formatters.O.bind(debugFactory);
const log_o = debugFactory.formatters.o.bind(debugFactory);

const loggerHandler = Logger.createDefaultHandler({
  formatter: function (messages, context) {
    if (typeof messages[0] === 'object') messages.shift();
    messages.unshift(`[${context.name ?? 'secondfry'}]`);
    messages.unshift(`[${context.level.name}]`);
    messages.unshift(`[${getTimestamp()}]`);
  },
});
Logger.setHandler(loggerHandler);
Logger.setLevel(Logger.TRACE);

const AuthLogger = Logger.get(`secondfry:auth`);

export { AuthLogger, log_O, log_o, getTimestamp };
