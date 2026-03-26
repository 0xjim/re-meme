import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { requestMemeRefresh } from "../../../lib/redux/slices/refresh";

export const RefreshNewMemeBtn = () => {
    const router = useRouter();
    const dispatch = useDispatch();

    const onRefreshClick = () => {
        if (router.pathname === "/") {
            dispatch(requestMemeRefresh());
            return;
        }
        router.push("/");
    };

    return (
        <button
            type="button"
            onClick={onRefreshClick}
            className='icon-btn-medium lg:w-auto lg:btn-with-icon-medium no-underline hover:text-neutral-black'
        >
            <img src="/assets/icons/refresh.svg" className='icon-md lg:icon-sm' alt="Refresh meme" />
            <span className='hidden lg:block'>Refresh meme</span>
        </button>
    )
}
