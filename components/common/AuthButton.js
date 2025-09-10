import {useSession, signIn, signOut} from 'next-auth/react'

export default function AuthButton() {
    const {data: session, status} = useSession()

    if (status === 'loading') {
        return (
            <button className='auth-btn auth-btn--loading' disabled>
                <div className='auth-spinner'></div>
                Loading...
            </button>
        )
    }

    if (session) {
        return (
            <div className='auth-user-info'>
                <div className='auth-user-details'>
                    {session.user.image && (
                        <img
                            src={session.user.image}
                            alt={session.user.name}
                            className='auth-user-avatar'
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
            </div>
        )
    }

    return (
        <button className='auth-btn auth-btn--signin' onClick={() => signIn()}>
            Sign in
        </button>
    )
}