const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')

// Initialize Express
const app = express()
const PORT = process.env.PORT || 8000 // default port 8000

// Uses EJS for views
app.set('view engine', 'ejs')

// parse application/x-www-form-urlencoded form data into req.body
app.use(bodyParser.urlencoded({ extended: false }))

// Set up cookie parser middleware.
// - Access cookies with req.cookies or req.signedCookies if the cookie was signed.
// - Set cookies with res.cookie('cookieName')
// cookieParser takes in the secret key as an argument. It uses this key to
// sign cookies.
app.use(cookieParser('my_super_secret_key'))

// Serve static files (css, images etc.) from /public
app.use(express.static('public'))

// I'm also adding a logging middleware so we can see what's going on
// with our server. More info: https://github.com/expressjs/morgan
app.use(morgan('dev'))

// Let's create our own middleware to check for a logged in user!
// This prevents repetition, as we won't have to check this on every route.
function checkUser(req, res, next) {
  // We want to leave /login and /signup available even if the user
  // isn't logged in, for obvious reasons.
  if (req.path === '/login' || req.path === '/signup') {
    next() // Execute next middleware or go to routes
    return
  }

  // Get user from cookies
  const currentUser = req.signedCookies.current_user
  if (currentUser) {
    console.log('User is logged in!', currentUser)
    req.currentUser = currentUser // We can add values to req and res in a middleware function
    next() // ALways call next!
  }
  else {
    res.redirect('/login')
  }
}

// Now we put our middleware into use
app.use(checkUser)


// Let's keep all of our data in one place
const data = {
  users: [
    {username: 'fabio', password: 'secret!'}
  ]
}


/*
 * HERE BE ROUTES!
 */

app.get('/cookies', (req, res) => {
  res.render('cookies', {cookies: req.signedCookies})
})

app.get('/', (req, res) => {
  res.redirect('treasure')
});

app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/login', (req, res) => {
  const username = req.body.username
  const password = req.body.password
  // Find user by username
  const user = data.users.find((user) => { return user.username === username })
  if (!user) {
    res.redirect('/login')
    return
  }
  // check the password
  bcrypt.compare(password, user.password, (err, matched) => {
    if (matched) {
      // set a cookie to keep track of the user
      res.cookie('current_user', user.username, {signed: true})
      res.redirect('/treasure')
    }
    else {
      res.redirect('/login')
    }
  })
})

app.get('/signup', (req, res) => {
  res.render('signup')
})

app.post('/signup', (req, res) => {
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) {
      res.send('There was an error creating your account.')
      return
    }
    // add user to database
    data.users.push({username: req.body.username, password: hash})
    console.log('All users are: ', data.users)
    res.redirect('/')
  })
  // don't put code here
})

app.get('/logout', (req, res) => {
  res.cookie('current_user', '', {signed: true})
  res.redirect('/login')
})

app.get('/treasure', (req, res) => {
  res.render('treasure', {currentUser: req.currentUser})
})

app.get('/secretpage', (req, res) => {
  res.render('secretpage')
})


// Start Express
app.listen(PORT, () => {
  console.log(`Express listening on port ${PORT}!`)
})
