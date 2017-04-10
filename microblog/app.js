var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var session = require('express-session');

var MongoStore = require('connect-mongo')(session);

var routes = require('./routes/index');

var app = express();

app.use(session({
	secret: 'secret',
  resave:true,
  saveUninitialized: false,
  store: new MongoStore({
        url: 'mongodb://localhost/nodes',
    }),
	cookie:{
		maxAge:1000*60*30
	}

}));
app.use(flash());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.html',require('ejs').__express);//两个下划线
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next){
	res.locals.user = req.session.user;
	var err = req.session.error;
	delete req.session.error;
  var error = req.flash('error');
  res.locals.error = error.length? error:null;

  var success = req.flash('success');
  res.locals.success = success.length?success:null;
	res.locals.message = '';
	if(err){
		res.locals.message = '<div class ="alert alert-danger" style="margin-bottom:20px;color:red;">'+err+'</div>';
	}
	next();
})

app.use('/', routes);
app.use('/login', routes);
app.use('/reg', routes);
app.use('/logout', routes);
app.use('/personal', routes);
app.use('/home', routes);
app.use('/mymood', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(3333);

module.exports = app;
