import moment from "moment";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import useComments from "../../../hooks/useComments";
import useWindowDimensions from "../../../hooks/window-dimensions.hook";
import { PublicationData } from "../../../models/Publication/publication.model";
import { parseIpfs } from "../../../utils/link";
import Remixes from "../../Modals/Remixes";
import { ProfileCard } from "../../ProfileCard";
import { RemixCount } from "../../RemixCount";
import { ReportModal } from "../../Modals/ReportModal";
import Image from "next/image";

type MemeDetailProps = {
    meme: PublicationData;
    inspired?: boolean;
}

export const MemeDetail = ({ meme, inspired }: MemeDetailProps) => {

    const { width } = useWindowDimensions();
    const router = useRouter()
    const { data } = useAccount();
    const [disabled, setDisabled] = useState(false);
    const [remixesOpen, setRemixesOpen] = useState(false)
    const [imageHover, setImageHover] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false);

    const { data: commentsPageData } = useComments(meme.id)

    useEffect(() => {
        setDisabled(!data ? true : false)
    }, [data])

    const handleRemixClick = () => {
        router.push(`/meme/${meme.id}/edit`)
    }

    const onImageHover = () => {
        setImageHover(true)
    }

    const onImageHoverOut = () => {
        setImageHover(false)
    }

    const memeSrc = parseIpfs(meme.metadata.media[0].original.url)

    return (
        <>
            <Remixes totalCount={commentsPageData?.publications.pageInfo.totalCount} remixes={commentsPageData?.publications.items} open={remixesOpen} setOpen={setRemixesOpen} />
            <div className="main-container lg:w-3/5">
                {
                    inspired ?
                    <div className="flex justify-between w-full items-center mb-[16px]">
                        <p className="text-subtitle-2 mb-0">GET INSPIRED</p>
                        <button onClick={handleRemixClick} disabled={disabled} className="btn-small-tertiary">Remix</button>
                    </div>
                    : null
                }   
                <div className="relative w-full">
                    <img src={memeSrc} onMouseOver={onImageHover} onMouseOut={onImageHoverOut} className="w-full rounded-xl mb-[16px]" />

                    <button onClick={() => setShowConfirm(true)} onMouseOver={onImageHover} className={`btn-with-icon-small-secondary ${imageHover ? "!opacity-100" : "opacity-0" } absolute top-3 right-3`}>
                        <img src="/assets/icons/report.svg" className="icon-sm" />
                        <span>Report</span>
                    </button>
                </div>
                <div className="flex w-full justify-between items-center">
                    <ProfileCard profile={meme.profile} subText={moment(meme.createdAt).format('MMM Do YYYY')} />
                    <RemixCount handleClick={() => setRemixesOpen(true)} count={commentsPageData?.publications.pageInfo.totalCount || 0} />
                </div>
                <ReportModal show={showConfirm} setShow={setShowConfirm} memeid={meme.id}/>
            </div>
        </>
    )
}