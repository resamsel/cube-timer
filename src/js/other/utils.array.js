// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Array.prototype.unique = function(eq) {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(eq(a[i], a[j]))
                a.splice(j--, 1);
        }
    }

    return a;
};

Array.prototype.first = function(defaultValue) {
    if(this.length > 0) {
        return this[0];
    }
    return defaultValue || 0;
};

Array.prototype.last = function(defaultValue) {
    if(this.length > 0) {
        return this[this.length - 1];
    }
    return defaultValue || 0;
};

Array.prototype.lpad = function(size, element) {
    while(this.length < size) {
        this.splice(0, 0, element);
    }
    return this;
};

Array.prototype.rpad = function(size, element) {
    while(this.length < size) {
        this.push(element);
    }
    return this;
};

Array.prototype.avg = function() {
    var sum = function(a, b) { return a + b; };
    if(this.length > 0) {
        return this.reduce(sum, 0) / this.length;
    }
    return 0;
};
