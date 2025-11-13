import {useSession, signIn, signOut} from 'next-auth/react'
import Image from 'next/image'
import styles from '../../styles/modules/AuthButton.module.css'

export default function AuthButton() {
    const {data: session, status} = useSession()

    if (status === 'loading') {
        return (
            <button className={`${styles.btn} ${styles.btnLoading}`} disabled>
                <div className={styles.spinner}></div>
                Loading...
            </button>
        )
    }

    if (session) {
        return (
            <div className={styles.userInfo}>
                <div className={styles.userDetails}>
                    {session.user.image && (
                        <Image
                            src={session.user.image}
                            alt={session.user.name}
                            className={styles.userAvatar}
                            width={40}
                            height={40}
                        />
                    )}
                    <div className={styles.userText}>
                        <span className={styles.userName}>{session.user.name}</span>
                        <span className={styles.userEmail}>{session.user.email}</span>
                    </div>
                </div>
                <button className={`${styles.btn} ${styles.btnSignout}`} onClick={() => signOut()}>
                    Sign out
                </button>
            </div>
        )
    }

    return (
        <button className={`${styles.btn} ${styles.btnSignin}`} onClick={() => signIn()}>
            Sign in
        </button>
    )
}