// src/shared/utils/Container.js - Container Implementation
class Container {
    constructor() {
        this.dependencies = new Map();
        this.singletons = new Map();
    }

    register(name, factory, singleton = false) {
        if (typeof factory !== 'function') {
            throw new Error(`Factory for '${name}' must be a function`);
        }

        this.dependencies.set(name, { factory, singleton });
        return this;
    }

    resolve(name) {
        const dependency = this.dependencies.get(name);

        if (!dependency) {
            throw new Error(`Dependency '${name}' not found. Available: ${Array.from(this.dependencies.keys()).join(', ')}`);
        }

        if (dependency.singleton) {
            if (!this.singletons.has(name)) {
                try {
                    const instance = dependency.factory();
                    this.singletons.set(name, instance);
                } catch (error) {
                    throw new Error(`Error creating singleton '${name}': ${error.message}`);
                }
            }
            return this.singletons.get(name);
        }

        try {
            return dependency.factory();
        } catch (error) {
            throw new Error(`Error creating instance '${name}': ${error.message}`);
        }
    }

    has(name) {
        return this.dependencies.has(name);
    }

    clear() {
        this.dependencies.clear();
        this.singletons.clear();
    }

    // Get all registered dependency names
    getRegistered() {
        return Array.from(this.dependencies.keys());
    }
}

module.exports = Container;