import Ember from 'ember';

const {
    merge
} = Ember;

// TODO: pass component not via scope
let component;

/*
 Ember's implementation of HTMLBars creates an enriched scope.

 * self: same as HTMLBars, this field represents the dynamic lookup
 of root keys that are not special keywords or block arguments.
 * blocks: same as HTMLBars, a bundle of named blocks the layout
 can yield to.
 * component: indicates that the scope is the layout of a component,
 which is used to trigger lifecycle hooks for the component when
 one of the streams in its layout fires.
 * attrs: a map of key-value attributes sent in by the invoker of
 a template, and available in the component's layout.
 * locals: a map of locals, produced by block params (`as |a b|`)
 * localPresent: a map of available locals to avoid expensive
 `hasOwnProperty` checks.

 The `self` field has two special meanings:

 * If `self` is a view (`isView`), the actual HTMLBars `self` becomes
 the view's `context`. This is legacy semantics; components always
 use the component itself as the `this`.
 * If `self` is a view, two special locals are created: `view` and
 `controller`. These locals are legacy semantics.
 * If self has a `hasBoundController` property, it is coming from
 a legacy form of #with or #each
 (`{{#with something controller=someController}}`). This has
 the special effect of giving the child scope the supplied
 `controller` keyword, with an unrelated `self`. This is
 legacy functionality, as both the `view` and `controller`
 keywords have been deprecated.

 **IMPORTANT**: There are two places in Ember where the ambient
 controller is looked up. Both of those places use the presence
 of `scope.locals.view` to indicate that the controller lookup
 should be dynamic off of the ambient view. If `scope.locals.view`
 does not exist, the code assumes that it is inside of a top-level
 template (without a view) and uses the `self` itself as the
 controller. This means that if you remove `scope.locals.view`
 (perhaps because we are finally ready to shed the view keyword),
 there may be unexpected consequences on controller semantics.
 If this happens to you, I hope you find this comment. - YK & TD

 In practice, this means that with the exceptions of top-level
 view-less templates and the legacy `controller=foo` semantics,
 the controller hierarchy is managed dynamically by looking at
 the current view's `controller`.
 */

export
default {
    setupState(lastState, env, scope, params, hash) {
            const isRender = params[0] === 'render';
            component = isRender ? env.hooks.keywords.render : env.hooks.keywords.component;
            const mut = env.hooks.keywords['@mut'];

            const {
                ___params
            } = hash;
            delete hash.___params;
            hash = merge(hash, env.hooks.getValue(___params));

            Object.keys(hash).forEach((key) = > {
                if ((key.indexOf('__') === 0)) {
                    const stream = scope.self.get(hash[key]);
                    if (!stream.isActive) {
                        stream.subscriberHead = params[0].subscriberHead;
                        stream.subscriberTail = params[0].subscriberTail;
                        stream.activate();
                    }
                    hash[key.replace('__', '')] = mut(null, env, null, [stream]);
                    delete hash[key];
                    // TODO: document this
                } else if ((key.indexOf('_') === 0) && key !== '_param') {
                    hash[key.replace('_', '')] = env.hooks.getValue(hash[key]);
                    delete hash[key];
                }
            });

            if ('_param' in hash) {
                let param = typeof hash._param === 'string' ? hash._param : env.hooks.getValue(hash._param);
                params.push(param);
                delete hash._param;
            }
            delete hash.renderTo;
            if (isRender) {
                params.shift();
            }
            return component.setupState(lastState, env, scope, params, hash);
        },

        render(morph, ...rest) {
            component.render(...arguments);
        },

        rerender() {
            component.rerender(...arguments);
        }
};
