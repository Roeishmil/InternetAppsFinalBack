module.exports = {
  apps : [{
    name   : "PhotoShare",
    script : "./dist/app.js",
    env_production: {
      NODE_ENV: "production",
    },
  }]
}
