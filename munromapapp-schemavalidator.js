"use strict";

if (!window.MunroMapApp) {
    throw "Munro Map App must be loaded first"
}

window.MunroMapApp.SchemaValidator = {

    _uniqueIDsValidator: {
        validate: function (schema, data, parentSchema, dataPath, parentData, property, rootData) {
            if (!schema) return true;
            var distinct = []
            for (var i = 0; i < data.length; i++) {
                var val = data[i].id;
                if (distinct.indexOf(val) < 0) {
                    distinct.push(val);
                } else {
                    return false;
                }
            }
            return true;
        },
        errors: false
    },

    _mustReferToAnotherNodeValidator: {
        validate: function (schema, data, parentSchema, dataPath, parentData, property, rootData) {
            if (!schema) return true;
            for (var i = 0; i < data.length; i++) {
                var link = data[i];
                var target = rootData.nodes.filter(function (d) {
                    return d.id === link;
                }).pop();
                if (!target) return false;
            }
            return true;
        },
        errors: false
    },

    _oneGoalValidator: {
        validate: function (schema, data, parentSchema, dataPath, parentData, property, rootData) {
            if (!schema) return true;
            var numberofGoals = 0;
            for (var i = 0; i < data.length; i++) {
                var val = data[i].type;
                if (val === "goal") {
                    numberofGoals++;
                }
            }
            return numberofGoals === 1;
        },
        errors: false
    },

    _atLeastOneNowValidator: {
        validate: function (schema, data, parentSchema, dataPath, parentData, property, rootData) {
            if (!schema) return true;
            var numberofNows = 0;
            for (var i = 0; i < data.length; i++) {
                var val = data[i].type;
                if (val === "now") {
                    numberofNows++;
                }
            }
            return numberofNows > 0;
        },
        errors: false
    },

    ValidateMap: function (json) {
        if (!Ajv) {
            throw "Ajv not loaded. MunroMaps requires ajv to be loaded.";
        }

        var app = window.MunroMapApp;
        var that = this;
        return new Promise(function (resolve) {
            d3.text(app.scriptFolder + "munromapapp-schema.json").then(function (schema) {
                var validator = new Ajv({ coerceTypes: true, allErrors: true, verbose: true })
                    .addKeyword('uniqueIDs', that._uniqueIDValidator)
                    .addKeyword('mustReferToAnotherNode', that._mustReferToAnotherNodeValidator)
                    .addKeyword('oneGoal', that._oneGoalValidator)
                    .addKeyword('atLeastOneNow', that._atLeastOneNowValidator);
                var validate = validator
                    .compile(JSON.parse(schema.replace(/\n/g, " ")
                        .replace(/\r/g, " ")
                        .replace(/\t/g, " ")
                        .replace(/\f/g, " ")));
                var valid = validate(json);
                if (!valid) {
                    var errors = JSON.parse(JSON.stringify(validate.errors));
                    window.dispatchEvent(new CustomEvent("MunroMap:ValidationError", {
                        detail: {
                            errors: errors
                        }
                    }));
                    window.MunroMapApp.logger.error("The supplied munro map does not meet the official munro map schema. This may result in errors.", errors);
                    resolve(false);
                } else {
                    window.dispatchEvent(new CustomEvent("MunroMap:ValidationComplete", {
                        detail: {
                            message: "Schema validation passed."
                        }
                    }));
                    window.dispatchEvent(new CustomEvent("MunroMap:NotificationRequired", {
                        detail: {
                            message: "Schema validation passed."
                        }
                    }));
                    window.MunroMapApp.logger.debug("Schema validation passed.");
                    resolve(true);
                }
            });
        });
    }
}