var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Tower.Model.Scope = (function() {
  var key, _fn, _i, _len, _ref;
  var _this = this;

  __extends(Scope, Tower.Class);

  Scope.scopes = ["where", "order", "asc", "desc", "limit", "offset", "select", "joins", "includes", "excludes", "paginate", "within", "allIn", "allOf", "alsoIn", "anyIn", "anyOf", "near", "notIn"];

  Scope.finders = ["find", "all", "first", "last", "count", "exists"];

  Scope.builders = ["create", "update", "delete", "destroy"];

  function Scope(options) {
    if (options == null) options = {};
    this.model = options.model;
    this.criteria = options.criteria || new Tower.Model.Criteria;
    this.store = this.model.store();
  }

  _ref = Scope.scopes;
  _fn = function(key) {
    return Scope.prototype[key] = function() {
      var clone, _ref2;
      clone = this.clone();
      (_ref2 = clone.criteria)[key].apply(_ref2, arguments);
      return clone;
    };
  };
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    key = _ref[_i];
    _fn(key);
  }

  Scope.prototype.find = function() {
    var callback, options, query, _ref2;
    _ref2 = this._extractArgs(arguments, {
      ids: true
    }), query = _ref2.query, options = _ref2.options, callback = _ref2.callback;
    return this._find(query, options, callback);
  };

  Scope.prototype._find = function(query, options, callback) {
    if (query.id && query.id.hasOwnProperty("$in") && query.id.$in.length === 1) {
      return this.store.findOne(query, options, callback);
    } else {
      return this.store.find(query, options, callback);
    }
  };

  Scope.prototype.first = function(callback) {
    var criteria;
    criteria = this.toQuery("asc");
    return this.store.findOne(criteria.query, criteria.options, callback);
  };

  Scope.prototype.last = function(callback) {
    var criteria;
    criteria = this.toQuery("desc");
    return this.store.findOne(criteria.query, criteria.options, callback);
  };

  Scope.prototype.all = function(callback) {
    var criteria;
    criteria = this.toQuery();
    return this.store.find(criteria.query, criteria.options, callback);
  };

  Scope.prototype.count = function(callback) {
    var criteria;
    criteria = this.toQuery();
    return this.store.count(criteria.query, criteria.options, callback);
  };

  Scope.prototype.exists = function(callback) {
    var criteria;
    criteria = this.toQuery();
    return this.store.exists(criteria.query, criteria.options, callback);
  };

  Scope.prototype.batch = function() {};

  Scope.prototype.build = function(attributes, options) {
    var criteria;
    criteria = this.toCreate();
    return this._build(attributes, criteria.query, criteria.options);
  };

  Scope.prototype.create = function() {
    var attributes, callback, criteria, options, _ref2;
    _ref2 = this._extractArgs(arguments, {
      attributes: true
    }), criteria = _ref2.criteria, attributes = _ref2.attributes, options = _ref2.options, callback = _ref2.callback;
    criteria.mergeAttributes(attributes);
    criteria.mergeOptions(options);
    return this._create(criteria, callback);
  };

  Scope.prototype.update = function() {
    var attributes, callback, criteria, options, _ref2;
    _ref2 = this._extractArgs(arguments, {
      ids: true,
      attributes: true
    }), criteria = _ref2.criteria, attributes = _ref2.attributes, options = _ref2.options, callback = _ref2.callback;
    criteria.mergeUpdates(attributes);
    criteria.mergeOptions(options);
    return this._update(criteria, callback);
  };

  Scope.prototype.destroy = function() {
    var callback, criteria, options, _ref2;
    _ref2 = this._extractArgs(arguments, {
      ids: true
    }), criteria = _ref2.criteria, options = _ref2.options, callback = _ref2.callback;
    criteria.mergeOptions(options);
    return this._destroy(criteria, callback);
  };

  Scope.prototype["delete"] = Scope.prototype.destroy;

  Scope.prototype.transaction = function() {};

  Scope.prototype.toQuery = function(sortDirection) {
    var criteria, sort;
    criteria = this.criteria.clone();
    if (sortDirection || !criteria.options.hasOwnProperty("sort")) {
      sort = this.model.defaultSort();
      if (sort) criteria[sortDirection || sort.direction](sort.name);
    }
    return criteria;
  };

  Scope.prototype.toCreate = function() {
    return this.toQuery();
  };

  Scope.prototype.toUpdate = function() {
    return this.toQuery();
  };

  Scope.prototype.toDestroy = function() {};

  Scope.prototype.merge = function(scope) {
    return this.criteria.merge(scope.criteria);
  };

  Scope.prototype.clone = function() {
    return new this.constructor({
      model: this.model,
      criteria: this.criteria.clone()
    });
  };

  Scope.prototype._build = function(attributes, query, options) {
    var object, result, _j, _len2;
    if (Tower.Support.Object.isArray(attributes)) {
      result = [];
      for (_j = 0, _len2 = attributes.length; _j < _len2; _j++) {
        object = attributes[_j];
        result.push(this.store.serializeModel(Tower.Support.Object.extend({}, query, object)));
      }
      return result;
    } else {
      return this.store.serializeModel(Tower.Support.Object.extend({}, query, attributes));
    }
  };

  Scope.prototype._create = function(criteria, callback) {
    var isArray, iterator, records;
    var _this = this;
    if (options.instantiate) {
      isArray = Tower.Support.Object.isArray(attributes);
      records = Tower.Support.Object.toArray(this.build(attributes, options));
      iterator = function(record, next) {
        if (record) {
          return record.save(next);
        } else {
          return next();
        }
      };
      return Tower.async(records, iterator, function(error) {
        if (!callback) {
          if (error) throw error;
        } else {
          if (error) return callback(error);
          if (isArray) {
            return callback(error, records);
          } else {
            return callback(error, records[0]);
          }
        }
      });
    } else {
      return this.store.create(attributes, options, callback);
    }
  };

  Scope.prototype._update = function(criteria, callback) {
    var iterator;
    if (options.instantiate) {
      iterator = function(record, next) {
        return record.updateAttributes(attributes, next);
      };
      return this._each(criteria.query, criteria.options, iterator, callback);
    } else {
      return this.store.update(attributes, criteria.query, criteria.options, callback);
    }
  };

  Scope.prototype._destroy = function(criteria, callback) {
    var iterator;
    if (options.instantiate) {
      iterator = function(record, next) {
        return record.destroy(next);
      };
      return this._each(criteria.query, criteria.options, iterator, callback);
    } else {
      return this.store.destroy(criteria.query, criteria.options, callback);
    }
  };

  Scope.prototype._each = function(query, options, iterator, callback) {
    var _this = this;
    return this.store.find(query, options, function(error, records) {
      if (error) {
        return callback.call(_this, error, records);
      } else {
        return Tower.async(records, iterator, function(error) {
          if (!callback) {
            if (error) throw error;
          } else {
            if (callback) return callback.call(_this, error, records);
          }
        });
      }
    });
  };

  Scope.prototype._extractArgs = function(args, opts) {
    var attributes, callback, criteria, ids, options;
    if (opts == null) opts = {};
    args = Tower.Support.Array.args(args);
    callback = Tower.Support.Array.extractBlock(args);
    if (opts.attributes && Tower.Support.Object.isHash(args[args.length - 1])) {
      attributes = args.pop();
    }
    if (Tower.Support.Object.isHash(args[args.length - 1])) {
      if (attributes) {
        options = attributes;
        attributes = args.pop();
      } else {
        options = args.pop();
      }
    }
    if (!opts.attributes) attributes = {};
    attributes || (attributes = {});
    criteria = this.criteria.clone();
    options || (options = {});
    if (!options.hasOwnProperty("instantiate")) options.instantiate = true;
    if (opts.ids && args.length > 0) ids = _.flatten(args);
    if (ids && ids.length > 0) {
      delete criteria.query.id;
      criteria.where({
        id: {
          $in: ids
        }
      });
    }
    return {
      criteria: criteria,
      attributes: attributes,
      callback: callback,
      options: options
    };
  };

  return Scope;

}).call(this);

module.exports = Tower.Model.Scope;