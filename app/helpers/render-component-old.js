import Ember from 'ember';
const {
    get,
    merge,
    $: {
        each
    },
    Handlebars,
    isArray,
    Logger: {
        warn
    }
} = Ember;

// import lookupHelper from "ember-htmlbars/system/lookup-helper";
// todo: find more correct way to import it
const lookupHelper = Ember.__loader.require('ember-htmlbars/system/lookup-helper').
default;

/**
 * Render component by name
 * @param componentPath
 * @param options
 *
 * Examples:
 *
 {{render-component 'image-component' src="" class="image"}}
 {{render-component 'pluralize-component' count=ungrouped.content.meta.total single="Object"}}
 {{#render-component 'btn-component' action="addSection"}}
 {{#render-component componentName _param='btn-component' action="addSection"}}
 or
 {{#render-component 'btn-component' action="addSection"}}
 Add section
 {{/render-component}}
 or even
 {{#render-component 'render-component' _param='btn-component' action="addSection"}}
 Add section
 {{/render-component}}
 You also can use ___params to define all properties via hash like
 instead of
 {{render-component 'pluralize-component' count=ungrouped.content.meta.total single="Object"}}
 you can use
 {{render-component 'pluralize-component' ___params=hash}}
 and hash is
 hash = { count:ungrouped.content.meta.total, single:"Object"}

 For cases when we need pass into component not only attributes but param too
 When we need this?
 for example you want to render
 {{componentName paramName someOption=someOptionValue}}
 You can do
 {{#render-component 'componentName' someOption=someOptionValue}}
 BUT! You can't do ( you can't pass more than one argument into component)
 {{#render-component 'componentName' paramName someOption=someOptionValue}}
 so for such cases you can use '_param' ( at line param or at hash property)
 {{#render-component 'componentName' _param=paramName someOption=someOptionValue}}
 or
 {{#render-component 'componentName' __params=paramsHash}}
 where paramsHash is
 paramsHash = { _param:paramName, someOption=someOptionValue }
 */
export
default

function(componentPath, options) {
    options.hashContexts = options.hashContexts || {};
    options.hashTypes = options.hashTypes || {};

    const {
        data: {
            view
        }
    } = options;
    let {
        hash
    } = options;

    const resolvePath = function(path) {
        return view.getStream ? view.getStream(path).value() : path;
    };

    let component = resolvePath(componentPath) || componentPath;
    if (typeof component !== 'string') {
        component = componentPath;
    }

    const {
        helperFunction: helper
    } = lookupHelper(component, view, Handlebars);

    // Allow to pass params as hash-object
    if ('___params' in hash) {
        const params = resolvePath(hash.___params);
        delete hash.___params;
        hash = merge(params, hash);
        options.hash = hash;
    }

    // Allow to specify which params should be resolved
    each(hash, (key, value) = > {
        const newKey = key.replace('__', '');
        if ((key.indexOf('__') === 0)) {
            options.hash[newKey] = (typeof value === 'string') ? view._getBindingForStream(value) : options.hash[newKey] = value;
            options.hashContexts[newKey] = get(view, 'controller');
            options.hashTypes[newKey] = 'ID';
        }
    });

    // For cases when we need pass into component not only attributes but param too
    // When we need this?
    // for example you want to render
    //    {{componentName paramName someOption=someOptionValue}}
    // You can do
    //    {{#render-component 'componentName' someOption=someOptionValue}}
    // BUT! You can't do ( you can't pass more than one argument into component)
    //    {{#render-component 'componentName' paramName someOption=someOptionValue}}
    // so for such cases you can use
    //    {{#render-component 'componentName' _param=paramName someOption=someOptionValue}}
    // or
    //    {{#render-component 'componentName' __params=paramsHash}}
    // where paramsHash is
    //    paramsHash = { _param:paramName, someOption=someOptionValue }
    let param;
    if ('_param' in hash) {
        param = view._getBindingForStream(hash._param).value() || hash._param;
        if (!isArray(param)) {
            param = [param];
        }
        delete hash._param;
    }

    if (!helper) {
        warn(`render - component can 't find handler for "${ component }"`);
    } else if (param) {
        helper.call(this, param, options, options, options); // this strange params for instanceHelper: function(newView, hash, options, env) { at ember.debug.js
    } else {
        helper.call(this, [], hash, options, options, options);
    }
}
