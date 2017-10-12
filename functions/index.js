const functions = require('firebase-functions')
const admin = require('firebase-admin')
const firebaseKeyEncode = require('firebase-key-encode')

admin.initializeApp(functions.config().firebase)

const ref = admin.database().ref()

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.onCreateUser = functions.auth.user().onCreate(event => {
	const uid = event.data.uid
	const displayName = event.data.displayName
	const email = event.data.email
	const photoUrl = event.data.photoURL

	return ref.child(`/users/${uid}/info`).set({
		uid: uid,
		name: displayName,
		email: email,
		photo_url: photoUrl,
		when_created: new Date().getTime(),
		when_created_text: new Date().toString(),
		last_login: new Date().getTime(),
		last_login_text: new Date().toString(),
		deleted: false
	})
});

exports.onDeleteUser = functions.auth.user().onDelete(event => {
	const uid = event.data.uid
	const userRef = ref.child(`/users/${uid}/info/deleted`)

	return userRef.set(true)
});

// On store score
exports.onCreateScore = functions.database
	.ref('/user-scores/{uid}/{puzzle}/{key}').onCreate(event => {
		const uid = event.params.uid
		const puzzle = event.params.puzzle
		const key = event.params.key
		const lastActive = new Date().getTime()
		const lastActiveText = new Date().toString()
		const updates = {};

		// Add score to the global puzzle scores
		updates[`/puzzle-scores/${puzzle}/${key}-${uid}`] = event.data.val()

		// Add puzzle to the global puzzles
		updates[`/puzzles/${puzzle}/name`] = firebaseKeyEncode.decode(puzzle)
		updates[`/puzzles/${puzzle}/latest`] = event.data.val()
		updates[`/puzzles/${puzzle}/last_active`] = lastActive
		updates[`/puzzles/${puzzle}/last_active_text`] = lastActiveText

		// Add puzzle to the user puzzles
		updates[`/users/${uid}/puzzles/${puzzle}/name`] = firebaseKeyEncode.decode(puzzle)
		updates[`/users/${uid}/puzzles/${puzzle}/latest`] = event.data.val()
		updates[`/users/${uid}/puzzles/${puzzle}/last_active`] = lastActive
		updates[`/users/${uid}/puzzles/${puzzle}/last_active_text`] = lastActiveText

		// Set last active of user
		updates[`/users/${uid}/info/latest`] = event.data.val()
		updates[`/users/${uid}/info/last_active`] = lastActive
		updates[`/users/${uid}/info/last_active_text`] = lastActiveText

		return ref.update(updates)
	});

// On remove score
exports.onDeleteScore = functions.database
	.ref('/user-scores/{uid}/{puzzle}/{key}').onDelete(event => {
		const uid = event.params.uid
		const puzzle = event.params.puzzle
		const key = event.params.key
		const lastActive = new Date().getTime()
		const lastActiveText = new Date().toString()
		const updates = {};

		// Remove score from the global puzzle scores
		updates[`/puzzle-scores/${puzzle}/${key}-${uid}`] = null

		// Set last active of user
		updates[`/users/${uid}/info/last_active`] = lastActive
		updates[`/users/${uid}/info/last_active_text`] = lastActiveText

		return ref.update(updates)
	});

// On store user puzzle
exports.onCreateUserPuzzle = functions.database
	.ref('/users/{uid}/puzzles/{puzzle}').onCreate(event => {
		const uid = event.params.uid
		const puzzle = event.params.puzzle
		const whenCreated = new Date().getTime()
		const whenCreatedText = new Date().toString()
		const updates = {};

		// Add puzzle to the global puzzles
		updates[`/puzzles/${puzzle}/name`] = firebaseKeyEncode.decode(puzzle)
		//updates[`/puzzles/${puzzle}/when_created`] = whenCreated
		//updates[`/puzzles/${puzzle}/when_created_text`] = whenCreatedText

		// Add puzzle to the user puzzles
		updates[`/users/${uid}/puzzles/${puzzle}/when_created`] = whenCreated
		updates[`/users/${uid}/puzzles/${puzzle}/when_created_text`] = whenCreatedText

		return ref.update(updates)
	});

// On delete user puzzle
exports.onDeleteUserPuzzle = functions.database
	.ref('/users/{uid}/puzzles/{puzzle}').onCreate(event => {
		const uid = event.params.uid
		const puzzle = event.params.puzzle

		return ref.child(`/user-scores/${uid}/${puzzle}`).set(null)
	});

// On store puzzle
exports.onCreatePuzzle = functions.database
	.ref('/puzzles/{puzzle}').onCreate(event => {
		const puzzle = event.params.puzzle
		const whenCreated = new Date().getTime()
		const whenCreatedText = new Date().toString()
		const updates = {};

		// Add puzzle to the global puzzles
		updates[`/puzzles/${puzzle}/when_created`] = whenCreated
		updates[`/puzzles/${puzzle}/when_created_text`] = whenCreatedText

		return ref.update(updates)
	});
