(function () {
  const execSync = require('child_process').execSync;

  function exit(msg, code) {
    if (msg) console.error(msg);
    process.exit(code || 1);
  }

  function exec(cmd, description) {
    if (description) {
      console.log(description);
    }

    if (typeof cmd === 'function') {
      try {
        return cmd();
      } catch (e) {
        exit(e.message);
      }
    } else {
      try {
        return execSync(cmd, {encoding: 'utf8'}).trim();
      } catch (e) {
        exit(`Command "${cmd}" failed, exiting.`);
      }
    }
  }

  exports.exec = exec;
})();