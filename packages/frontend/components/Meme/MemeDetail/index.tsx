import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import useComments from "../../../hooks/useComments";
import useWindowDimensions from "../../../hooks/window-dimensions.hook";
import { PublicationData } from "../../../models/Publication/publication.model";
import { parseIpfs } from "../../../utils/link";
import Remixes from "../../Modals/Remixes";
import { ProfileCard } from "../../ProfileCard";
import { RemixBtn } from "../../Remix/RemixBtn";
import { RemixCount } from "../../RemixCount";
import { ReportModal } from "../../Modals/ReportModal";
import Image from "next/image";

type MemeDetailProps = {
    meme: PublicationData;
    inspired?: boolean;
}

export const MemeDetail = ({ meme, inspired }: MemeDetailProps) => {

    const { width } = useWindowDimensions();
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
            <div className="comic-border bg-white n:p-4 lg:p-10 rounded-4xl w-full lg:w-3/5">

                {
                    inspired ?
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-lg font-bold mb-0">GET INSPIRED</p>
                        <RemixBtn btnText="Remix" onClick={handleRemixClick} disabled={disabled} className="comic-border-mini create-btn-gradient rounded-full px-4 text-lg font-bold" />
                    </div>
                    : null
                }

                <div className="relative">
                    <img src={memeSrc} onMouseOver={onImageHover} onMouseOut={onImageHoverOut} className="w-full h-auto rounded-xl" width={ width > 850 ? "1600": "800" } height={ width > 850 ? "1000": "500"} />
                    <button onClick={() => setShowConfirm(true)} onMouseOver={onImageHover} className={`flex items-center ${imageHover ? "!opacity-100" : "opacity-0" } absolute top-5 right-5 bg-white rounded-full p-3 border-black border-2 border-solid min-w-fit max-h-6 comic-border-mini`}>
                    <Image src="/assets/icons/report.svg" width={"30"} height={"20"} className="mr-2" />
                    Report
                    </button>
                </div>
                
                <div className="flex justify-between items-center n:mt-2 lg:mt-6">
                    <ProfileCard profile={meme.profile} subText={new Date(meme.createdAt).toLocaleDateString('fr-CA')} />
                    <RemixCount handleClick={() => setRemixesOpen(true)} count={commentsPageData?.publications.pageInfo.totalCount || 0} />
                </div>
                <ReportModal show={showConfirm} setShow={setShowConfirm}/>
            </div>
        </>
    )
}