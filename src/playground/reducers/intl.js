import {addLocaleData, IntlProvider} from 'react-intl';

import localeData from 'scratch-l10n';
import paintMessages from 'scratch-l10n/locales/paint-editor-msgs';

Object.keys(localeData).forEach(locale => {
    // TODO: will need to handle locales not in the default intl - see www/custom-locales
    addLocaleData(localeData[locale].localeData);
});

const intlInitialState = {
    intl: {
        defaultLocale: 'en',
        locale: 'en',
        messages: paintMessages.en.messages
    }
};

const updateIntl = locale => ({
    type: 'UPDATE_INTL',
    intl: {
        locale: locale,
        messages: paintMessages[locale].messages || paintMessages.en.messages
    }
});

const intlReducer = (state = intlInitialState.intl, action) => {
    if (action.type === 'UPDATE_INTL') {
        return {...state, ...action.intl};
    }
    return state;
};

export {
    intlReducer as default,
    IntlProvider,
    intlInitialState,
    updateIntl
};