import {useEffect} from 'react';
import {useUser} from '../../../context/user/UserContext.hook';
import {useNavigate} from 'react-router';
import {Loader} from '../../../component/organisms/loader/Loader';
import {AuthParams} from '../../../api/auth/Auth.interface';
import {getRedirectPath, setRedirectPath} from "../../../context/useRedirect";

const LoadingView = () => {
    const {login} = useUser()
    const navigate = useNavigate()

    useEffect(() => {
        const params = Object.fromEntries(
            new URLSearchParams(window.location.search),
        )

        login({...params as unknown as AuthParams})
            .then(() => {
                const redirectPath = getRedirectPath()
                setRedirectPath(null)

                navigate(redirectPath ?? '/')
            })
            .catch()
    }, [])

    return (
        <Loader />
    )
}

export default LoadingView
