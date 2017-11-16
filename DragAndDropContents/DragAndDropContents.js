var DragAndDropContents = (function () {
  return {
    read: function (opts, callback) {
      var options = this.extend({
        drop: '#DragAndDropContents-drop',
        maxFileSize: 100000, // reading too large a file may cause browser to lock up
        onError: function(msg) {},
        classOnDragOver: 'DragAndDropContents-hover',
        acceptedTypes: [
          'text/plain',
          'text/html',
          'text/csv',
          'text/css',
          'text/tab-separated-values'
        ],
        readAs: 'Text',
        formData: function() {}
      }, opts);

      // check for needed browser features
      var errors = 0;

      // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
      if ('draggable' in document.createElement('span') === false) {
        options.onError('HTML Drag and Drop API not supported');
        errors++;
      }

      // https://developer.mozilla.org/en-US/docs/Web/API/FormData
      if (typeof FormData === 'undefined') {
        options.onError('FormData API not supported');
        errors++;
      }

      // https://developer.mozilla.org/en-US/docs/Web/API/FileReader
      if (typeof FileReader === 'undefined') {
        options.onError('FileReader API not supported');
        errors++;
      }

      var el_drop = document.querySelectorAll(options.drop)[0];
      if (!el_drop) {
        options.onError('Could not find drop selector: ' + options.drop);
        errors++;
        return false;
      }

      if (errors > 0) {
        return false;
      }

      var prevClass = el_drop.className;

      el_drop.ondragover = function (e) {
        this.className = prevClass + ' ' + options.classOnDragOver;
        return false;
      };

      el_drop.ondragend = function (e) {
        this.className = prevClass;
        return false;
      };

      el_drop.ondragleave = function (e) {
        this.className = prevClass;
        return false;
      };

      el_drop.ondrop = function (e) {
        e.preventDefault();
        this.className = prevClass;
        readDroppedFiles(e.dataTransfer.files); // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer
      }

      // private functions

      function readAs(reader, file, type) {
        switch (type) {
          case 'ArrayBuffer':
            reader.readAsArrayBuffer(file);
            break;
          case 'BinaryString':
            reader.readAsArrayBuffer(file);
            break;
          case 'DataURL':
            reader.readAsDataURL(file);
            break;
          case 'Text':
          default:
            reader.readAsText(file);
            break;
        }
      }

      function readTextFromFile(file) {
        if (options.acceptedTypes.indexOf(file.type) !== -1) {
          var reader = new FileReader();
          reader.onload = function (e) {
            if (typeof callback === "function") {
              callback({ file: file, content: e.target.result });
            }
          };
          readAs(reader, file, options.readAs);
        } else {
          options.onError('Invalid MIME type: ' + file.type);
        }
      }

      function readDroppedFiles(files) {
        // debugger;
        var formData = new FormData();
        for (var i = 0; i < files.length; i++) {
          formData.append('file', files[i]);
          if (files[i].size > options.maxFileSize) {
            options.onError("Ignoring '" + files[i].name + "'. Size too big (max: " + options.maxFileSize + " bytes allowed)");
            continue;
          }
          readTextFromFile(files[i]);
        }
        if (typeof options.formData === "function") {
          options.formData(formData);
        }
      }

      // not used at the moment - users can do this outside the script if they need to using options.formData() callback
      function xhrSend(formData) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/devnull.php');
        xhr.onload = function (e) {}; // make callback
        xhr.upload.onprogress = function (e) {} // make callback
        xhr.send(formData);
      }
    },

    // equivalent to jQuery.extend()
    // ref: http://youmightnotneedjquery.com/#extend
    extend: function(out) {
      out = out || {};
      for (var i = 1; i < arguments.length; i++) {
        if (!arguments[i])
          continue;
        for (var key in arguments[i]) {
          if (arguments[i].hasOwnProperty(key))
            out[key] = arguments[i][key];
        }
      }
      return out;
    },
  }
})();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  module.exports = DragAndDropContents;
else
  window.DragAndDropContents = DragAndDropContents;
