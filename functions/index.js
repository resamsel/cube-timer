const MERGE = {merge: true}

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const firebaseKeyEncode = require('firebase-key-encode')

admin.initializeApp(functions.config().firebase)

const firestore = admin.firestore()

function deleteQueryBatch(db, query, batchSize, resolve, reject) {
	query.get()
		.then((snapshot) => {
			// When there are no documents left, we are done
			if (snapshot.size == 0) {
				return 0;
			}

			// Delete documents in a batch
			var batch = db.batch();
			snapshot.docs.forEach(function(doc) {
				batch.delete(doc.ref);
			});

			return batch.commit().then(function() {
				return snapshot.size;
			});
		}).then(function(numDeleted) {
			if (numDeleted <= batchSize) {
				resolve();
				return;
			}

			// Recurse on the next process tick, to avoid
			// exploding the stack.
			process.nextTick(function() {
				deleteQueryBatch(db, query, batchSize, resolve, reject);
			});
		})
		.catch(reject);
}

// https://firebase.google.com/docs/functions/write-firebase-functions

exports.onCreateUser = functions.auth.user().onCreate(event => {
	const uid = event.data.uid
	const displayName = event.data.displayName
	const email = event.data.email
	const photoUrl = event.data.photoURL
	const now = new Date()
	const user = {
		uid: uid,
		name: displayName,
		email: email,
		photoUrl: photoUrl,
		whenCreated: now.getTime(),
		whenCreatedText: now.toString(),
		lastLogin: now.getTime(),
		lastLoginText: now.toString(),
		deleted: false
	}

	return Promise.all([
		firestore.doc(`users/${uid}`).set(user, MERGE)
			.then(docRef => {
				console.log("User created", docRef)
			})
			.catch(error => {
				console.error("Error while creating user", error)
			}),
		firestore.doc(`users/${{uid}}/puzzles/3x3x3`).set({name: '3x3x3'}, MERGE)
	])
});

exports.onDeleteUser = functions.auth.user().onDelete(event => {
	const uid = event.data.uid
	return firestore.doc(`users/${uid}`).set({deleted: true}, MERGE)
});

// On store score
exports.onCreateScore = functions.firestore
	.document('users/{uid}/puzzles/{puzzle}/scores/{key}').onCreate(event => {
		const uid = event.params.uid
		const puzzle = event.params.puzzle
		const key = event.params.key
		const now = new Date()
		const lastActive = now.getTime()
		const lastActiveText = now.toString()
		const data = {
			latest: firestore.doc(`users/${uid}/puzzles/${puzzle}/scores/${key}`),
			lastActive: lastActive,
			lastActiveText: lastActiveText
		}
		const puzzleData = {
			name: firebaseKeyEncode.decode(puzzle),
			latest: firestore.doc(`users/${uid}/puzzles/${puzzle}/scores/${key}`),
			lastActive: lastActive,
			lastActiveText: lastActiveText
		}

		return Promise.all([
			// Add score to the global puzzle scores
			firestore.doc(`puzzles/${puzzle}/scores/${key}-${uid}`)
				.set(event.data.data()),
			// Add puzzle to the global puzzles
			firestore.doc(`puzzles/${puzzle}`).set(puzzleData, MERGE),
			// Add puzzle to the user puzzles
			firestore.doc(`users/${uid}/puzzles/${puzzle}`)
				.set(puzzleData, MERGE),
			// Set last active of user
			firestore.doc(`users/${uid}`).set(data, MERGE)
		])
	});

// On remove score
exports.onDeleteScore = functions.firestore
	.document('users/{uid}/puzzles/{puzzle}/scores/{key}').onDelete(event => {
		const uid = event.params.uid
		const puzzle = event.params.puzzle
		const key = event.params.key
		const now = new Date()
		const data = {
			lastActive: now.getTime(),
			lastActiveText: now.toString()
		}

		return Promise.all([
			// Remove score from the global puzzle scores
			firestore.doc(`puzzles/${puzzle}/scores/${key}-${uid}`)
				.delete(),
			// Set last active of user
			firestore.doc(`users/${uid}`).set(data, MERGE)
		])
	});

// On store user puzzle
exports.onCreateUserPuzzle = functions.firestore
	.document('users/{uid}/puzzles/{puzzle}').onCreate(event => {
		const uid = event.params.uid
		const puzzle = event.params.puzzle
		const whenCreated = new Date().getTime()
		const whenCreatedText = new Date().toString()
		const data = {
			whenCreated: whenCreated,
			whenCreatedText: whenCreatedText
		}
		const puzzleData = {
			name: firebaseKeyEncode.decode(puzzle)
		}

		return Promise.all([
			// Add puzzle to the global puzzles
			firestore.doc(`puzzles/${puzzle}`).set(puzzleData, MERGE),
			// Add puzzle to the user puzzles
			firestore.doc(`users/${uid}/puzzles/${puzzle}`)
				.set(data, MERGE)
		])
	});

// On delete user puzzle
exports.onDeleteUserPuzzle = functions.firestore
	.document('users/{uid}/puzzles/{puzzle}').onDelete(event => {
		const uid = event.params.uid
		const puzzle = event.params.puzzle

		return Promise.all([
			new Promise(function(resolve, reject) {
				deleteQueryBatch(
					firestore,
					firestore.collection(`users/${uid}/puzzles/${puzzle}/scores`),
					100,
					resolve,
					reject
				)
			}),
			firestore.doc(`users/${uid}/puzzles/${puzzle}`).delete()
		])
	});

// On store puzzle
exports.onCreatePuzzle = functions.firestore
	.document('puzzles/{puzzle}').onCreate(event => {
		const puzzle = event.params.puzzle
		const now = new Date()
		const data = {
			whenCreated: now.getTime(),
			whenCreatedText: now.toString()
		}

		// Add puzzle to the global puzzles
		return firestore.doc(`puzzles/${puzzle}`).set(data, MERGE)
	});
