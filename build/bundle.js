
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Footer.svelte generated by Svelte v3.46.4 */

    const file$3 = "src/Footer.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "شخصی سازی / درباره";
    			attr_dev(p, "class", "svelte-2jb4g3");
    			add_location(p, file$3, 5, 4, 104);
    			set_style(div, "background-color", /*bg*/ ctx[0]);
    			attr_dev(div, "class", "svelte-2jb4g3");
    			add_location(div, file$3, 4, 0, 63);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);

    			if (!mounted) {
    				dispose = listen_dev(
    					p,
    					"click",
    					function () {
    						if (is_function(/*action*/ ctx[1])) /*action*/ ctx[1].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*bg*/ 1) {
    				set_style(div, "background-color", /*bg*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	let { bg } = $$props;
    	let { action } = $$props;
    	const writable_props = ['bg', 'action'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('bg' in $$props) $$invalidate(0, bg = $$props.bg);
    		if ('action' in $$props) $$invalidate(1, action = $$props.action);
    	};

    	$$self.$capture_state = () => ({ bg, action });

    	$$self.$inject_state = $$props => {
    		if ('bg' in $$props) $$invalidate(0, bg = $$props.bg);
    		if ('action' in $$props) $$invalidate(1, action = $$props.action);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bg, action];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { bg: 0, action: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*bg*/ ctx[0] === undefined && !('bg' in props)) {
    			console.warn("<Footer> was created without expected prop 'bg'");
    		}

    		if (/*action*/ ctx[1] === undefined && !('action' in props)) {
    			console.warn("<Footer> was created without expected prop 'action'");
    		}
    	}

    	get bg() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bg(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get action() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set action(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Message.svelte generated by Svelte v3.46.4 */

    const file$2 = "src/Message.svelte";

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let h1;
    	let t0;
    	let t1;
    	let div1;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(/*text*/ ctx[0]);
    			t1 = space();
    			div1 = element("div");
    			img = element("img");
    			add_location(h1, file$2, 6, 4, 134);
    			attr_dev(div0, "id", "msg");
    			attr_dev(div0, "class", "svelte-89o3wm");
    			add_location(div0, file$2, 5, 2, 115);
    			if (!src_url_equal(img.src, img_src_value = "./assets/tiger.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "tiger");
    			attr_dev(img, "class", "svelte-89o3wm");
    			add_location(img, file$2, 9, 4, 190);
    			attr_dev(div1, "id", "img-container");
    			attr_dev(div1, "class", "svelte-89o3wm");
    			add_location(div1, file$2, 8, 2, 161);
    			attr_dev(div2, "id", "container");
    			set_style(div2, "background-color", /*bg*/ ctx[1]);
    			attr_dev(div2, "class", "svelte-89o3wm");
    			add_location(div2, file$2, 4, 0, 61);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) set_data_dev(t0, /*text*/ ctx[0]);

    			if (dirty & /*bg*/ 2) {
    				set_style(div2, "background-color", /*bg*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Message', slots, []);
    	let { text } = $$props;
    	let { bg } = $$props;
    	const writable_props = ['text', 'bg'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Message> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('bg' in $$props) $$invalidate(1, bg = $$props.bg);
    	};

    	$$self.$capture_state = () => ({ text, bg });

    	$$self.$inject_state = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('bg' in $$props) $$invalidate(1, bg = $$props.bg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, bg];
    }

    class Message extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { text: 0, bg: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Message",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*text*/ ctx[0] === undefined && !('text' in props)) {
    			console.warn("<Message> was created without expected prop 'text'");
    		}

    		if (/*bg*/ ctx[1] === undefined && !('bg' in props)) {
    			console.warn("<Message> was created without expected prop 'bg'");
    		}
    	}

    	get text() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bg() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bg(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    class Settings {
        constructor(text = "سال نو مبارک", bg = "#555555", fg = "#ffffff", chars = ["🥳", "🎉", "✨"]) {
            this.text = text;
            this.bg = bg;
            this.fg = fg;
            this.chars = chars;
            this.encode = () => (Settings.baseUrl + encodeURIComponent(JSON.stringify(this))).replace(/\s/g, "");
        }
        setUsingQuery() {
            const urlParams = new URLSearchParams(window.location.search);
            if (!urlParams.has("settings")) {
                return;
            }
            let data = JSON.parse(decodeURIComponent(urlParams.get("settings")));
            if (data.text) {
                this.text = data.text;
            }
            if (data.chars) {
                this.chars = data.chars;
            }
            if (data.bg) {
                this.bg = data.bg;
            }
            if (data.fg) {
                this.fg = data.fg;
            }
            console.log(this);
        }
    }
    Settings.baseUrl = "localhost:8080?settings=";
    var settings = writable(new Settings());

    /* src/SettingsInfo.svelte generated by Svelte v3.46.4 */
    const file$1 = "src/SettingsInfo.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let label1;
    	let t4;
    	let input1;
    	let t5;
    	let label2;
    	let t7;
    	let input2;
    	let t8;
    	let label3;
    	let t10;
    	let input3;
    	let input3_value_value;
    	let t11;
    	let br0;
    	let t12;
    	let textarea;
    	let t13;
    	let button0;
    	let t15;
    	let button1;
    	let t17;
    	let div0;
    	let t18;
    	let a;
    	let t20;
    	let br1;
    	let t21;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "متن:";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			label1 = element("label");
    			label1.textContent = "رنگ پس زمینه:";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			label2 = element("label");
    			label2.textContent = "رنگ کادر متن:";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			label3 = element("label");
    			label3.textContent = "کاراکتر های باران(ایموجی ها):";
    			t10 = space();
    			input3 = element("input");
    			t11 = space();
    			br0 = element("br");
    			t12 = space();
    			textarea = element("textarea");
    			t13 = space();
    			button0 = element("button");
    			button0.textContent = "کپی لینک ساخته شده";
    			t15 = space();
    			button1 = element("button");
    			button1.textContent = "بازگشت";
    			t17 = space();
    			div0 = element("div");
    			t18 = text("ساخته شده توسط ");
    			a = element("a");
    			a.textContent = "amin-pro";
    			t20 = space();
    			br1 = element("br");
    			t21 = text("\n    منبع عکس ببر: all-free-download.com");
    			add_location(label0, file$1, 11, 2, 294);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-89ngms");
    			add_location(input0, file$1, 12, 2, 316);
    			add_location(label1, file$1, 13, 2, 368);
    			attr_dev(input1, "type", "color");
    			attr_dev(input1, "class", "svelte-89ngms");
    			add_location(input1, file$1, 14, 2, 399);
    			add_location(label2, file$1, 15, 2, 450);
    			attr_dev(input2, "type", "color");
    			attr_dev(input2, "class", "svelte-89ngms");
    			add_location(input2, file$1, 16, 2, 481);
    			add_location(label3, file$1, 17, 2, 532);
    			attr_dev(input3, "type", "text");
    			input3.value = input3_value_value = /*$settings*/ ctx[2].chars.join("");
    			attr_dev(input3, "class", "svelte-89ngms");
    			add_location(input3, file$1, 18, 2, 579);
    			add_location(br0, file$1, 23, 2, 673);
    			textarea.value = /*url*/ ctx[3];
    			attr_dev(textarea, "class", "svelte-89ngms");
    			add_location(textarea, file$1, 24, 2, 680);
    			attr_dev(button0, "class", "svelte-89ngms");
    			add_location(button0, file$1, 25, 2, 709);
    			attr_dev(button1, "class", "svelte-89ngms");
    			add_location(button1, file$1, 26, 2, 797);
    			attr_dev(a, "href", "https://github.com/amin-pro");
    			add_location(a, file$1, 28, 19, 867);
    			add_location(br1, file$1, 29, 4, 922);
    			add_location(div0, file$1, 27, 2, 842);
    			attr_dev(div1, "id", "container");
    			set_style(div1, "background-color", /*bg*/ ctx[0]);
    			attr_dev(div1, "dir", "rtl");
    			attr_dev(div1, "class", "svelte-89ngms");
    			add_location(div1, file$1, 10, 0, 230);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label0);
    			append_dev(div1, t1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*$settings*/ ctx[2].text);
    			append_dev(div1, t2);
    			append_dev(div1, label1);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    			set_input_value(input1, /*$settings*/ ctx[2].bg);
    			append_dev(div1, t5);
    			append_dev(div1, label2);
    			append_dev(div1, t7);
    			append_dev(div1, input2);
    			set_input_value(input2, /*$settings*/ ctx[2].fg);
    			append_dev(div1, t8);
    			append_dev(div1, label3);
    			append_dev(div1, t10);
    			append_dev(div1, input3);
    			append_dev(div1, t11);
    			append_dev(div1, br0);
    			append_dev(div1, t12);
    			append_dev(div1, textarea);
    			append_dev(div1, t13);
    			append_dev(div1, button0);
    			append_dev(div1, t15);
    			append_dev(div1, button1);
    			append_dev(div1, t17);
    			append_dev(div1, div0);
    			append_dev(div0, t18);
    			append_dev(div0, a);
    			append_dev(div0, t20);
    			append_dev(div0, br1);
    			append_dev(div0, t21);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen_dev(input3, "input", /*changeChars*/ ctx[4], false, false, false),
    					listen_dev(button0, "click", /*click_handler*/ ctx[8], false, false, false),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*dismiss*/ ctx[1])) /*dismiss*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*$settings*/ 4 && input0.value !== /*$settings*/ ctx[2].text) {
    				set_input_value(input0, /*$settings*/ ctx[2].text);
    			}

    			if (dirty & /*$settings*/ 4) {
    				set_input_value(input1, /*$settings*/ ctx[2].bg);
    			}

    			if (dirty & /*$settings*/ 4) {
    				set_input_value(input2, /*$settings*/ ctx[2].fg);
    			}

    			if (dirty & /*$settings*/ 4 && input3_value_value !== (input3_value_value = /*$settings*/ ctx[2].chars.join("")) && input3.value !== input3_value_value) {
    				prop_dev(input3, "value", input3_value_value);
    			}

    			if (dirty & /*url*/ 8) {
    				prop_dev(textarea, "value", /*url*/ ctx[3]);
    			}

    			if (dirty & /*bg*/ 1) {
    				set_style(div1, "background-color", /*bg*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let url;
    	let $settings;
    	validate_store(settings, 'settings');
    	component_subscribe($$self, settings, $$value => $$invalidate(2, $settings = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SettingsInfo', slots, []);
    	let { bg } = $$props;
    	let { dismiss } = $$props;

    	function changeChars(e) {
    		set_store_value(settings, $settings.chars = e.target.value.split(""), $settings);
    	}

    	const writable_props = ['bg', 'dismiss'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SettingsInfo> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		$settings.text = this.value;
    		settings.set($settings);
    	}

    	function input1_input_handler() {
    		$settings.bg = this.value;
    		settings.set($settings);
    	}

    	function input2_input_handler() {
    		$settings.fg = this.value;
    		settings.set($settings);
    	}

    	const click_handler = () => navigator.clipboard.writeText(url);

    	$$self.$$set = $$props => {
    		if ('bg' in $$props) $$invalidate(0, bg = $$props.bg);
    		if ('dismiss' in $$props) $$invalidate(1, dismiss = $$props.dismiss);
    	};

    	$$self.$capture_state = () => ({
    		settings,
    		bg,
    		dismiss,
    		changeChars,
    		url,
    		$settings
    	});

    	$$self.$inject_state = $$props => {
    		if ('bg' in $$props) $$invalidate(0, bg = $$props.bg);
    		if ('dismiss' in $$props) $$invalidate(1, dismiss = $$props.dismiss);
    		if ('url' in $$props) $$invalidate(3, url = $$props.url);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$settings*/ 4) {
    			settings.set($settings);
    		}

    		if ($$self.$$.dirty & /*$settings*/ 4) {
    			$$invalidate(3, url = $settings.encode());
    		}
    	};

    	return [
    		bg,
    		dismiss,
    		$settings,
    		url,
    		changeChars,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		click_handler
    	];
    }

    class SettingsInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { bg: 0, dismiss: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SettingsInfo",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*bg*/ ctx[0] === undefined && !('bg' in props)) {
    			console.warn("<SettingsInfo> was created without expected prop 'bg'");
    		}

    		if (/*dismiss*/ ctx[1] === undefined && !('dismiss' in props)) {
    			console.warn("<SettingsInfo> was created without expected prop 'dismiss'");
    		}
    	}

    	get bg() {
    		throw new Error("<SettingsInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bg(value) {
    		throw new Error("<SettingsInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dismiss() {
    		throw new Error("<SettingsInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dismiss(value) {
    		throw new Error("<SettingsInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (40:2) {:else}
    function create_else_block(ctx) {
    	let settingsinfo;
    	let current;

    	settingsinfo = new SettingsInfo({
    			props: {
    				bg: /*$settings*/ ctx[2].fg,
    				dismiss: /*func_1*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(settingsinfo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(settingsinfo, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const settingsinfo_changes = {};
    			if (dirty & /*$settings*/ 4) settingsinfo_changes.bg = /*$settings*/ ctx[2].fg;
    			if (dirty & /*showSettings*/ 1) settingsinfo_changes.dismiss = /*func_1*/ ctx[4];
    			settingsinfo.$set(settingsinfo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settingsinfo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settingsinfo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(settingsinfo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(40:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (37:2) {#if !showSettings}
    function create_if_block(ctx) {
    	let message;
    	let t;
    	let footer;
    	let current;

    	message = new Message({
    			props: {
    				text: /*$settings*/ ctx[2].text,
    				bg: /*$settings*/ ctx[2].fg
    			},
    			$$inline: true
    		});

    	footer = new Footer({
    			props: {
    				bg: /*$settings*/ ctx[2].fg,
    				action: /*func*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(message.$$.fragment);
    			t = space();
    			create_component(footer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(message, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const message_changes = {};
    			if (dirty & /*$settings*/ 4) message_changes.text = /*$settings*/ ctx[2].text;
    			if (dirty & /*$settings*/ 4) message_changes.bg = /*$settings*/ ctx[2].fg;
    			message.$set(message_changes);
    			const footer_changes = {};
    			if (dirty & /*$settings*/ 4) footer_changes.bg = /*$settings*/ ctx[2].fg;
    			if (dirty & /*showSettings*/ 1) footer_changes.action = /*func*/ ctx[3];
    			footer.$set(footer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(message.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(message.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(message, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(37:2) {#if !showSettings}",
    		ctx
    	});

    	return block;
    }

    // (51:0) {#each confetti as c}
    function create_each_block(ctx) {
    	let span;
    	let t_value = /*c*/ ctx[6].character + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			set_style(span, "left", /*c*/ ctx[6].x + "%");
    			set_style(span, "top", /*c*/ ctx[6].y + "%");
    			set_style(span, "transform", "scale(" + /*c*/ ctx[6].r + ")");
    			attr_dev(span, "class", "svelte-trzu6f");
    			add_location(span, file, 51, 2, 1332);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*confetti*/ 2 && t_value !== (t_value = /*c*/ ctx[6].character + "")) set_data_dev(t, t_value);

    			if (dirty & /*confetti*/ 2) {
    				set_style(span, "left", /*c*/ ctx[6].x + "%");
    			}

    			if (dirty & /*confetti*/ 2) {
    				set_style(span, "top", /*c*/ ctx[6].y + "%");
    			}

    			if (dirty & /*confetti*/ 2) {
    				set_style(span, "transform", "scale(" + /*c*/ ctx[6].r + ")");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(51:0) {#each confetti as c}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let each_1_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*showSettings*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let each_value = /*confetti*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			set_style(div, "background-color", /*$settings*/ ctx[2].bg);
    			attr_dev(div, "class", "svelte-trzu6f");
    			add_location(div, file, 35, 0, 946);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			if (!current || dirty & /*$settings*/ 4) {
    				set_style(div, "background-color", /*$settings*/ ctx[2].bg);
    			}

    			if (dirty & /*confetti*/ 2) {
    				each_value = /*confetti*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, 'settings');
    	component_subscribe($$self, settings, $$value => $$invalidate(2, $settings = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let showSettings = false;
    	$settings.setUsingQuery();
    	let characters = ["🥳", "🎉", "✨"];

    	let confetti = new Array(100).fill(null).map((_, i) => {
    		return {
    			character: characters[i % characters.length],
    			x: Math.random() * 100,
    			y: -20 - Math.random() * 100,
    			r: 0.1 + Math.random() * 1
    		};
    	}).sort((a, b) => a.r - b.r);

    	onMount(() => {
    		let frame;

    		function loop() {
    			frame = requestAnimationFrame(loop);

    			$$invalidate(1, confetti = confetti.map(emoji => {
    				emoji.y += 0.7 * emoji.r;
    				if (emoji.y > 120) emoji.y = -20;
    				return emoji;
    			}));
    		}

    		loop();
    		return () => cancelAnimationFrame(frame);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const func = () => $$invalidate(0, showSettings = true);

    	const func_1 = function () {
    		$$invalidate(0, showSettings = false);
    		console.log(1);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Footer,
    		Message,
    		settings,
    		SettingsInfo,
    		showSettings,
    		characters,
    		confetti,
    		$settings
    	});

    	$$self.$inject_state = $$props => {
    		if ('showSettings' in $$props) $$invalidate(0, showSettings = $$props.showSettings);
    		if ('characters' in $$props) characters = $$props.characters;
    		if ('confetti' in $$props) $$invalidate(1, confetti = $$props.confetti);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showSettings, confetti, $settings, func, func_1];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
