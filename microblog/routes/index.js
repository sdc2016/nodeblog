var express = require('express');
var router = express.Router();
var user = require('../database/db').user;
var tweet = require('../database/db').tweet;

/* GET home page. */
router.get('/', function(req, res) {
	if (!req.session.user) {
		res.render('index', {
			title: '首页'
		});
	} else {
		tweet.find({}, function(err, doc) {
			res.render('index', {
				title: '首页',
				user: req.session.user,
				datalist: doc
			});
		});
	}

});

/* login */
router.route('/login').get(function(req, res) {
	res.render('login', {});
}).post(function(req, res) {
	var query = {
		name: req.body.username,
		password: req.body.password
	};
	(function() {
		user.count(query, function(err, doc) { //count返回集合中文档的数量，和 find 一样可以接收查询条件。query 表示查询的条件
			if (doc == 1) {
				console.log(query.name + ": 登陆成功 " + new Date());
				req.session.user = query.name;
				//res.send(200);
				res.redirect('/home');
			} else {
				console.log(query.name + ": 登陆失败 ,用户名或密码错误！" + new Date());
				req.session.error = '登陆失败 ,用户名或密码错误！';
				//res.send(404);
				res.redirect('/login');
			}
		});
	})(query);
});

router.route('/reg').get(function(req, res) {
	res.render('reg', {});
}).post(function(req, res) {
	if (req.body.password != req.body.password2) {
		console.log('两次输入的口令不一致！');
		res.send({
			ret: true,
			msg: '两次输入的口令不一致'
		});
		return res.redirect('/reg');
	} else {
		var query = {
			name: req.body.username,
			password: req.body.password
		};
		(function() {
			user.count(query, function(err, doc) {
				console.log("err:" + err)
				console.log("doc:" + doc)
				if (doc) {
					console.log(query.name + ": 注册失败，此账号已有人注册 " + new Date());
					req.flash('success', '注册失败！');
					res.redirect('/reg');
				} else {
					user.create(query, function(err, doc) { //count返回集合中文档的数量，和 find 一样可以接收查询条件。query 表示查询的条件
						if (doc) {
							console.log(query.name + ": 注册成功 " + new Date());
							req.flash('success', '注册成功！');
							res.redirect('/reg');
						} else {
							console.log(query.name + ": 注册失败 " + new Date());
							res.redirect('/error');
						}
					});
				}
			})
		})(query);
	}
});

router.route('/personal').get(function(req, res) {
	if (!req.session.user) {
		req.session.error = '请先登录!';
		res.redirect('/login');
	}
	res.render('personal', {
		title: 'personal'
	});
}).post(function(req, res) {
	if (!req.body.newpwd || !req.body.newpwd || !req.body.newpwd2) {
		console.log("请填写完整！")
		return
	} else if (req.body.newpwd && req.body.newpwd != req.body.newpwd2) {
		console.log("输入的密码不一致。请重新输入！")
		return
	}
	var query = {
		name: req.session.user,
		password: req.body.oldpwd
	};
	(function() {
		user.count(query, function(err, doc) {
			if (doc) {
				var querys = {
					name: req.session.user,
					password: req.body.newpwd,
				}
				user.update(query, {
					$set: querys
				}, {
					multi: true
				}, function(err, docs) {
					if (docs) {
						req.session.user = null;
						req.session.error = null;
						console.log("修改成功！")
						res.redirect('/login');
					} else {
						console.log("修改密码失败！")
					}
				})
			} else {
				console.log("密码错误，请重新输入！");
				return;
			}
		})
	})(query)
});


router.get('/error', function(req, res) {
	res.render('error', {
		message: "error",
		error: {
			status: "status",
			stack: "status"
		}
	});
});

router.route('/home').get(function(req, res) {
	if (!req.session.user) {
		req.session.error = '请先登录!';
		res.redirect('/login');
	}
	tweet.find({}, function(err, doc) {
		res.render('home', {
			title: 'Home',
			user: req.session.user,
			datalist: doc
		});
	});
}).post(function(req, res) {
	var query = {
		name: req.session.user,
		tell: req.body.tweetinput,
		date: new Date()
	};
	(function() {
		if (req.body.tweetinput) {
			tweet.create(query, function(err, doc) {
				console.log("doc:" + doc)
				if (doc) {
					console.log(query.name + ": 发布成功 " + new Date());
					res.redirect('/home');
				} else {
					console.log(query.name + ": 发布失败 " + new Date());
					res.redirect('/error');
				}
			});
		} else {
			console.log("请填写内容！ ");
			return;
		}
	})(query);
});

router.route('/mymood').get(function(req, res) {
	if (!req.session.user) {
		req.session.error = '请先登录!';
		res.redirect('/login');
	}
	tweet.find({
		name: req.session.user
	}, function(err, doc) {
		res.render('mymood', {
			title: 'mymood',
			user: req.session.user,
			datalist: doc
		});
	});
}).post(function(req, res) {
	var query = {
		name: req.body.moodname,
		tell: req.body.moodtell
	};
	(function() {
		console.log(req.body.moodid);
		tweet.remove({
			_id: req.body.moodid.toString().replace(/\s+/g, '')
		}, function(err, doc) {
			if (doc) {
				console.log(query.name + ": 删除成功 " + new Date());
				res.redirect('/mymood');
			} else {
				console.log(query.name + ": 删除失败 " + new Date());
				console.log(err.message);
				res.redirect('/error');
			}
		});
	})(query);
})

router.get('/logout', function(req, res) {
	req.session.user = null;
	req.session.error = null;
	res.redirect('/');
});


/* ucenter */
router.post('/ucenter', function(req, res) {
	var query = {
		name: req.body.username,
		password: req.body.password
	};
	(function() {
		user.count(query, function(err, doc) { //count返回集合中文档的数量，和 find 一样可以接收查询条件。query 表示查询的条件
			if (doc == 1) {
				console.log(query.name + ": 登陆成功 " + new Date());
				res.render('ucenter', {
					title: 'ucenter'
				});
			} else {
				console.log(query.name + ": 登陆失败 " + new Date());
				res.redirect('/error');
			}
		});
	})(query);
});

module.exports = router;