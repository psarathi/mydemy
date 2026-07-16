import {useSession, signIn, signOut} from 'next-auth/react'
import Image from 'next/image'
import {useState} from 'react'
import {useLearner} from '../../contexts/LearnerContext'

export default function AuthButton() {
    const {data: session, status} = useSession()
    const {activeUser, users, hasAdmin, login, logout, saveUser} = useLearner()
    const [username, setUsername] = useState('')
    const [pin, setPin] = useState('')
    const [newUser, setNewUser] = useState({username: '', displayName: '', pin: '', role: 'learner'})
    const [importGuestActivity, setImportGuestActivity] = useState(true)
    const [error, setError] = useState('')
    const isPinSignedIn = activeUser.id !== 'guest'

    const handlePinLogin = async (event) => {
        event.preventDefault()
        setError('')
        try {
            await login(username, pin)
            setPin('')
        } catch (loginError) {
            setError(loginError.message)
        }
    }

    const handleSaveUser = async (event) => {
        event.preventDefault()
        setError('')
        try {
            const role = hasAdmin ? newUser.role : 'admin'
            await saveUser({...newUser, role}, {importGuestActivity: !hasAdmin && importGuestActivity})
            setNewUser({username: '', displayName: '', pin: '', role: 'learner'})
        } catch (saveError) {
            setError(saveError.message)
        }
    }

    if (status === 'loading') {
        return (
            <button className='auth-btn auth-btn--loading' disabled>
                <div className='auth-spinner'></div>
                Loading...
            </button>
        )
    }

    const pinPanel = (
        <div className='pin-auth-panel'>
            <div className='pin-auth-heading'>
                <span>{isPinSignedIn ? activeUser.displayName : 'PIN sign in'}</span>
                {isPinSignedIn && (
                    <button className='auth-btn auth-btn--signout' onClick={logout}>
                        Sign out PIN
                    </button>
                )}
            </div>

            {!isPinSignedIn && hasAdmin && (
                <form className='pin-auth-form' onSubmit={handlePinLogin}>
                    <select value={username} onChange={(event) => setUsername(event.target.value)} aria-label='Learner username'>
                        <option value=''>Choose learner</option>
                        {users.filter((user) => user.active).map((user) => (
                            <option key={user.id} value={user.username}>
                                {user.displayName}
                            </option>
                        ))}
                    </select>
                    <input
                        value={pin}
                        onChange={(event) => setPin(event.target.value)}
                        placeholder='PIN'
                        inputMode='numeric'
                        type='password'
                    />
                    <button className='auth-btn auth-btn--signin' type='submit'>
                        Unlock
                    </button>
                </form>
            )}

            {(!hasAdmin || activeUser.role === 'admin') && (
                <form className='pin-auth-form pin-auth-form--admin' onSubmit={handleSaveUser}>
                    <input
                        value={newUser.username}
                        onChange={(event) => setNewUser({...newUser, username: event.target.value})}
                        placeholder={hasAdmin ? 'New username' : 'Admin username'}
                    />
                    <input
                        value={newUser.displayName}
                        onChange={(event) => setNewUser({...newUser, displayName: event.target.value})}
                        placeholder='Display name'
                    />
                    <input
                        value={newUser.pin}
                        onChange={(event) => setNewUser({...newUser, pin: event.target.value})}
                        placeholder='Set PIN'
                        inputMode='numeric'
                        type='password'
                    />
                    {hasAdmin && (
                        <select
                            value={newUser.role}
                            onChange={(event) => setNewUser({...newUser, role: event.target.value})}
                            aria-label='User role'
                        >
                            <option value='learner'>Learner</option>
                            <option value='admin'>Admin</option>
                        </select>
                    )}
                    {!hasAdmin && (
                        <label className='pin-auth-checkbox'>
                            <input
                                type='checkbox'
                                checked={importGuestActivity}
                                onChange={(event) => setImportGuestActivity(event.target.checked)}
                            />
                            Import guest activity
                        </label>
                    )}
                    <button className='auth-btn auth-btn--signin' type='submit'>
                        {hasAdmin ? 'Add user' : 'Create admin'}
                    </button>
                </form>
            )}
            {error && <div className='pin-auth-error'>{error}</div>}
        </div>
    )

    if (session) {
        return (
            <div className='auth-user-info'>
                <div className='auth-user-details'>
                    {session.user.image && (
                        <Image
                            src={session.user.image}
                            alt={session.user.name}
                            className='auth-user-avatar'
                            width={40}
                            height={40}
                        />
                    )}
                    <div className='auth-user-text'>
                        <span className='auth-user-name'>{session.user.name}</span>
                        <span className='auth-user-email'>{session.user.email}</span>
                    </div>
                </div>
                <button className='auth-btn auth-btn--signout' onClick={() => signOut()}>
                    Sign out
                </button>
                {pinPanel}
            </div>
        )
    }

    return (
        <div className='auth-stack'>
            {pinPanel}
            <button className='auth-btn auth-btn--signin' onClick={() => signIn()}>
                Continue with OAuth
            </button>
        </div>
    )
}
