import { ChangeEventHandler, useEffect, useLayoutEffect, useRef, useState } from "react"
import { fabric } from 'fabric';
import useWindowDimensions from "../../hooks/window-dimensions.hook";
import EditTextModal, { EditText, TextConfig } from "../Modals/EditTextModal";
import web3StorageClient from "../../config/web3Storage";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { User } from "../../models/User/user.model";
import { useMutation } from "@apollo/client";
import { CREATE_COMMENT_TYPED_DATA, CREATE_POST_TYPED_DATA } from "../../queries/publication";
import { CreateCommentTypedData, CreateCommentTypedDataParams, CreatePostTypedData, CreatePostTypedDataParams, PublicationData } from "../../models/Publication/publication.model";
import { useContract, useSigner, useSignTypedData } from "wagmi";
import { ethers, utils } from "ethers";
import LensHubAbi from '../../utils/contracts/abis/LensHub.json'
import { v4 as uuidv4 } from 'uuid'
import { ConfirmModal } from "../Modals/Confirm";
import { FeedbackModal } from "../Modals/Feedback";
import omitDeep from 'omit-deep'
import { parseIpfs } from "../../utils/link";
import UploadMemeError, { UploadError } from "../Modals/UploadMemeError";
import { useMemeFromTxHash } from "../../hooks/useMeme";
import { selectedEnvironment } from "../../config/environments";
import useLensModuleEnabledCurrencies from "../../hooks/useLensModuleEnabledCurrencies";
import { BROADCAST_MUTATION } from "../../queries/broadcast";
import { BroadcastData, BroadcastParams } from "../../models/Broadcast/broadcast.model";
import { base64 } from "ethers/lib/utils";
import useRefSizes from "../../hooks/useRefSizes";
import { Resizable } from "re-resizable";

interface PathEvent {
    path?: fabric.Path
}

interface MetadataMedia {
    item: string
    type: string
}

enum MetadataDisplayType {
    number = 'number',
    string = 'string',
    data = 'date'
}

interface MetadataAttribute {
    displayType?: MetadataDisplayType
    traitType?: string
    value: string
}

interface PublicationMetadata {
    version: string
    metadata_id: string
    external_url?: string
    name: string
    attributes: MetadataAttribute[]
    image: string
    imageMimeType: string
    media: MetadataMedia[]
    appId: string
}

interface EditStepProps {
    publication?: PublicationData
    initialImage?: string,
    onUpload: (newPublication: PublicationData) => void
}

const DEFAULT_TEXT_CONFIG = {
    top: 0,
    left: 0,
    fontFamily: 'Helvetica',
    fill: '#000000',
    shadow: new fabric.Shadow("0px 0px 6px rgb(256,256,256)")
}

const uploadImageAndMetadata = (image: string, canvasJson: string) => {
    const prunedInitialData = image.replace('data:image/jpeg;base64,', '')
    const decodedImage = base64.decode(prunedInitialData)
    const imageBlob = new Blob([decodedImage], { type: 'image/jpeg'})
    const imageFile = new File([imageBlob], 'meme')
    const canvasJsonBlob = new Blob([canvasJson], { type: 'application/json'})
    const canvasJsonFile = new File([canvasJsonBlob], 'canvas_state.json')
    return web3StorageClient.put([imageFile, canvasJsonFile]).then(cid => {
        const metadata : PublicationMetadata = {
            version: '1.0.0',
            metadata_id: uuidv4(),
            name: 'Created in re:meme',
            attributes: [],
            image: `ipfs://${cid}/meme`,
            imageMimeType: 'image/jpeg',
            media: [
                {
                    item: `ipfs://${cid}/meme`,
                    type: 'image/jpeg'
                }
            ],
            appId: selectedEnvironment.appId
        }
        const jsonMetadata = JSON.stringify(metadata)
        const metadataBlob = new Blob([jsonMetadata], { type: 'application/json'})
        const metadataFile = new File([metadataBlob], 'meme-metadata.json')
        return web3StorageClient.put([metadataFile], { wrapWithDirectory: false })
    })
}

const disableMiddleResizeButtons = (object: fabric.Object) => {
    object.setControlsVisibility({
        mt: false, // middle top disable
        mb: false, // midle bottom
        ml: false, // middle left
        mr: false, // I think you get it
    });
}

const EditStep : React.FC<EditStepProps> = ({ publication, initialImage, onUpload }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const { width, height } = useRefSizes(containerRef.current)
    const [ uploadError, setUploadError ] = useState<UploadError | undefined>()
    const [ showConfirm, setShowConfirm ] = useState(false)
    const [ txHash, setTxHash ]= useState<string>()
    const [ loading, setLoading ] = useState(false)
    const { width: windowWidth } = useWindowDimensions();
    const isSmallScreen = windowWidth < 1024
    const [ canvas, setCanvas ] = useState<fabric.Canvas>();
    const [ texts, setTexts ] = useState<fabric.Text[]>([])
    const [ images, setImages ] = useState<fabric.Image[]>([])
    const [ backgroundImage, setBackgroundImage ] = useState<fabric.Image | string>()
    const [ drawings, setDrawings ] = useState<fabric.Path[]>([])
    const [ isDrawingMode, setIsDrawingMode ] = useState<boolean>(false)
    const user = useSelector<RootState, User | null>(state => state.user.selectedUser)
    const { signTypedDataAsync } = useSignTypedData()
    const [ openTextModal, setOpenTextModal ] = useState({
        open: false,
        index: 0
    })

    const { currencies } = useLensModuleEnabledCurrencies()

    const { data: signer } = useSigner()

    const lensHubContract = useContract({
        addressOrName: selectedEnvironment.lensHubAddress,
        contractInterface: LensHubAbi,
        signerOrProvider: signer
    })

    const [ postTypedData ] = useMutation<CreatePostTypedData, CreatePostTypedDataParams>(CREATE_POST_TYPED_DATA)
    const [ commentTypedData ] = useMutation<CreateCommentTypedData, CreateCommentTypedDataParams>(CREATE_COMMENT_TYPED_DATA)
    const [ broadcast ] = useMutation<BroadcastData, BroadcastParams>(BROADCAST_MUTATION)
    const { publication: newPublication, loading: newPublicationLoading, error: newPublicationError } = useMemeFromTxHash(txHash)

    const handleMemeText = (e, index) => {
        if(e.target.value.length > 100) return
        texts[index].set({
            text: e.target.value
        })
        canvas?.setActiveObject(texts[index])
        canvas?.renderAll()
        setTexts(texts => [...texts])
    }

    const openEditTextModal = (index: number) => {
        setOpenTextModal({
            index,
            open: true
        })
    }

    const deleteText = (index: number) => {
        if(canvas) {
            const text = texts[index]
            canvas.remove(text)
            setTexts(texts => texts.slice(0, index).concat(texts.slice(index+1)) )
        }
    }

    const onDeleteImage = (index: number) => {
        if(canvas) {
            const image = images[index]
            canvas.remove(image)
            setImages(images => images.slice(0, index).concat(images.slice(index+1)) )
        }
    }

    const onDeleteBackgroundImage = () => {
        if(canvas) {
            canvas.backgroundImage = undefined
            setBackgroundImage(undefined)
            canvas.renderAll()
        }
    }

    const onDeleteDraw = (index: number) => {
        if(canvas) {
            setDrawings(draw => draw.slice(0, index).concat(draw.slice(index+1)) )
        }
    }

    const onRemix = () => {
        setShowConfirm(true)
    }

    const encodeDefaultModuleData = () => {
        return ethers.utils.defaultAbiCoder.encode([
            "uint256",
            "address",
            "address",
            "uint16",
            "bool"
        ], [
            0,
            currencies[0]?.address,
            ethers.constants.AddressZero,
            0,
            false
        ])
    }

    const handleConfirm = () => {
        setShowConfirm(false)
        setLoading(true)
        const jpegMeme = canvas?.toDataURL({ format: 'jpeg' })
        if(jpegMeme && user) {
            uploadImageAndMetadata(jpegMeme, JSON.stringify(canvas?.toJSON(['width', 'height']))).then(metadataResult => {
                const mutationPostParams = {
                    profileId: user.id || '',                        
                    contentURI: `ipfs://${metadataResult}`,
                    collectModule: {
                        unknownCollectModule: {
                            contractAddress: selectedEnvironment.collectModuleAddress,
                            data: encodeDefaultModuleData()
                        }
                    },
                    referenceModule: {
                        followerOnlyReferenceModule: false
                    }
                }
                if(publication) {
                    const commentPostParams = {
                        publicationId: publication.id,
                        ...mutationPostParams
                    }
                    return commentTypedData({ variables: { request: commentPostParams }}).then(postResult => {
                        if(postResult.data?.createCommentTypedData) {
                            const typedData = postResult.data.createCommentTypedData.typedData
                            const id = postResult.data.createCommentTypedData.id
                            return signTypedDataAsync({
                                domain: omitDeep(typedData.domain, '__typename'),
                                value: omitDeep(typedData.value, '__typename'),
                                types: omitDeep(typedData.types, '__typename')
                            }).then(async (signedType) => {
                                if(process.env.NEXT_PUBLIC_LENS_BROADCAST_ON) {
                                    broadcast({
                                        variables: {
                                            request: {
                                                id,
                                                signature: signedType
                                            }
                                        }
                                    }).then(broadcastResult => {
                                        setTxHash(broadcastResult.data?.broadcast.txHash)
                                    })
                                } else {
                                    const { v, r, s } = utils.splitSignature(signedType)
                                    const tx = await lensHubContract["commentWithSig"]({
                                        profileId: typedData.value.profileId,
                                        contentURI:typedData.value.contentURI,
                                        profileIdPointed: typedData.value.profileIdPointed,
                                        pubIdPointed: typedData.value.pubIdPointed,
                                        referenceModuleData: typedData.value.referenceModuleData,
                                        collectModule: typedData.value.collectModule,
                                        collectModuleInitData: typedData.value.collectModuleInitData,
                                        referenceModule: typedData.value.referenceModule,
                                        referenceModuleInitData: typedData.value.referenceModuleInitData,
                                        sig: {
                                            v,
                                            r,
                                            s,
                                            deadline: typedData.value.deadline,
                                        },
                                    });
                                    tx.wait(1).then(() => {
                                        setTxHash(tx.hash)
                                    })
                                }
                            })
                        }
                    })
                } else {
                    return postTypedData({ variables: { request: mutationPostParams } }).then(postResult => {
                        if(postResult.data?.createPostTypedData) {
                            const typedData = postResult.data.createPostTypedData.typedData
                            const id = postResult.data.createPostTypedData.id
                            return signTypedDataAsync({
                                domain: omitDeep(typedData.domain, '__typename'),
                                value: omitDeep(typedData.value, '__typename'),
                                types: omitDeep(typedData.types, '__typename')
                            }).then(async (signedType) => {
                                if(process.env.NEXT_PUBLIC_LENS_BROADCAST_ON) {
                                    broadcast({
                                        variables: {
                                            request: {
                                                id,
                                                signature: signedType
                                            }
                                        }
                                    }).then(broadcastResult => {
                                        setTxHash(broadcastResult.data?.broadcast.txHash)
                                    })
                                }
                                else {
                                    const { v, r, s } = utils.splitSignature(signedType)
                                    const tx = await lensHubContract["postWithSig"]({
                                        profileId: typedData.value.profileId,
                                        contentURI:typedData.value.contentURI,
                                        collectModule: typedData.value.collectModule,
                                        collectModuleInitData: typedData.value.collectModuleInitData,
                                        referenceModule: typedData.value.referenceModule,
                                        referenceModuleInitData: typedData.value.referenceModuleInitData,
                                        sig: {
                                            v,
                                            r,
                                            s,
                                            deadline: typedData.value.deadline,
                                        },
                                    });
                                    tx.wait(1).then(() => {
                                        setTxHash(tx.hash)
                                    })
                                }
                            })
                        }
                    })
                }
            }).catch(() => {
                setUploadError(UploadError.TX_ERROR)
                setLoading(false)
            })
        }
    }

    const uploadFileHandler = () => {
        document.getElementById("upload-file")!.click()
    }

    const setConfig = (newConfig: TextConfig, index: number) => {
        const selectedText = texts[index]
        selectedText.set({
            fontFamily: newConfig.font,
            fill: newConfig.textColor,
            shadow: newConfig.shadowColor
        })
        canvas?.renderAll()
        setTexts(texts => [...texts])
    }

    const addImage: ChangeEventHandler<HTMLInputElement> = (input) => {
        if (input.target.files && input.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (!e.target?.result) return;
                const img = new Image()
                img.src = e.target.result?.toString()
                img.onload = () => {
                    if(containerRef.current && canvas) {
                        const fabricImage = new fabric.Image(img, {
                            top: 0,
                            left: 0
                        })
                        if(fabricImage.getScaledWidth() > fabricImage.getScaledHeight()) {
                            fabricImage.scaleToWidth(containerRef.current.clientWidth / 2 >> 0)
                        } else {
                            fabricImage.scaleToHeight(containerRef.current.clientHeight / 2 >> 0)
                        }
                        canvas.add(fabricImage)
                        setImages(images => images.concat([fabricImage]))
                    }
                }
            };
            reader.readAsDataURL(input.target.files[0]);
        }
    }

    const clearFileCache =  (event: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
        const element = event.target as HTMLInputElement
        element.value = ''
    }

    useLayoutEffect(() => {
        if(containerRef.current) {
            const canvasCreation = new fabric.Canvas('meme-editor', { backgroundColor: 'white' })
            canvasCreation.freeDrawingBrush.color = 'black'
            canvasCreation.freeDrawingBrush.width = 2
            if(publication) {
                const newTexts : fabric.Text[] = []
                const newImages : fabric.Image[] = []
                const newDrawings : fabric.Path[] = []
                const ipfsLink = parseIpfs(publication.metadata.media[0].original.url)
                fetch(ipfsLink.replace(/\/meme.svg|\/meme/, '/canvas_state.json'))
                    .then(response => response.json()).then(canvasState => {
                        canvasCreation.loadFromJSON(canvasState, () => {
                            console.log(containerRef.current?.clientWidth)
                            console.log(canvasCreation.width)
                            console.log(canvasCreation.height)
                            const ratio = canvasCreation.getHeight() / canvasCreation.getWidth()
                            const canvasNewWidth = containerRef.current?.clientWidth || 0
                            const canvasNewHeight = canvasNewWidth * ratio
                            console.log(canvasNewHeight)
                            const scaleX = canvasNewWidth / canvasCreation.getWidth()
                            const scaleY = canvasNewHeight / canvasCreation.getHeight()
                            canvasCreation.setWidth(canvasNewWidth)
                            canvasCreation.setHeight(canvasNewHeight)
                            canvasCreation.getObjects().map(object => {
                                object.scaleX = (object.scaleX || 0) * scaleX
                                object.scaleY = (object.scaleY || 0) * scaleY
                                object.left = (object.left || 0) * scaleX
                                object.top = (object.top || 0) * scaleY
                                if(object.type === 'text') {
                                    disableMiddleResizeButtons(object)
                                    newTexts.push(object as fabric.Text)
                                }
                                else if(object.type === 'image') {
                                    newImages.push(object as fabric.Image)
                                }
                                else if(object.type === 'path') {
                                    newDrawings.push(object as fabric.Path)
                                }
                                setTexts(newTexts)
                                setImages(newImages)
                                setDrawings(newDrawings)
                            })
                            if(canvasCreation.backgroundImage) {
                                const publicationBackgroundImage = canvasCreation.backgroundImage as fabric.Image
                                if(publicationBackgroundImage.getScaledWidth() > publicationBackgroundImage.getScaledHeight()) {
                                    publicationBackgroundImage.scaleToWidth(containerRef.current?.clientWidth || 0)
                                } else {
                                    publicationBackgroundImage.scaleToHeight(containerRef.current?.clientHeight || 0)
                                }
                                setBackgroundImage(canvasCreation.backgroundImage)
                            }
                            canvasCreation.setBackgroundColor('white', () => {})
                        })
                    }).catch(() => {
                        fabric.loadSVGFromURL(ipfsLink, objects => {
                            objects.map(object => {
                                if(object.type === 'text') {
                                    disableMiddleResizeButtons(object)
                                    newTexts.push(object as fabric.Text)
                                }
                                else if(object.type === 'image') {
                                    newImages.push(object as fabric.Image)
                                }
                                else if(object.type === 'path') {
                                    newDrawings.push(object as fabric.Path)
                                }
                                canvasCreation.add(object)
                            })
                            setTexts(newTexts)
                            setImages(newImages)
                            setDrawings(newDrawings)
                            canvasCreation.renderAll()
                        })
                    }).finally(() => {
                        canvasCreation.renderAll()
                    })
            }
            else if(initialImage) {
                const img = new Image()
                img.src = initialImage
                img.onload = () => {
                    if(containerRef.current) {
                        const fabricImage = new fabric.Image(img, {
                            top: 0,
                            left: 0
                        })

                        fabricImage.scaleToWidth(containerRef.current.clientWidth)
                        canvasCreation.setWidth(containerRef.current.clientWidth)
                        canvasCreation.setHeight(fabricImage.getScaledHeight())
                        canvasCreation.setBackgroundImage(fabricImage, () => {
                            const newText = new fabric.Text('', DEFAULT_TEXT_CONFIG)
                            disableMiddleResizeButtons(newText)
                            canvasCreation.add(newText)
                            setTexts([newText])
                            setBackgroundImage(fabricImage)
                        })
                    }
                }
            }
            else {
                const newText = new fabric.Text('', DEFAULT_TEXT_CONFIG)
                canvasCreation.add(newText)
                disableMiddleResizeButtons(newText)
                setTexts([newText])
            }
            setCanvas(canvasCreation)

        }
    }, [initialImage, publication])

    useEffect(() => {
        /*
        if(containerRef.current && canvas) {
            canvas.setWidth(containerRef.current.clientWidth)
            canvas.setHeight(containerRef.current.clientWidth)
        }
        */
    }, [width, canvas])

    useEffect(() => {
        if(canvas && containerRef.current) {
            canvas.setWidth(containerRef.current?.clientWidth)
            canvas.setHeight(containerRef.current?.clientHeight)
            if(canvas.backgroundImage && canvas.backgroundImage instanceof fabric.Image) {
                canvas.backgroundImage.scaleToWidth(containerRef.current?.clientWidth)
            }
            canvas.renderAll()
            console.log(canvas.backgroundImage)
        }
    }, [width, canvas, height])

    useEffect(() => {
        if(canvas) {
            canvas.on('path:created', (e) => {
                const newPath = (e as PathEvent).path
                if(newPath) {
                    setDrawings(oldDrawings => oldDrawings.concat([newPath]))
                }
            })
        }
    }, [canvas])

    useEffect(() => {
        if(newPublication) {
            onUpload(newPublication)
        }
    }, [newPublication, onUpload])

    useEffect(() => {
        if(newPublicationError) {
            setUploadError(UploadError.TX_ERROR)
        }
    }, [newPublicationError])

    const onAddText = () => {
        const newText = new fabric.Text('', DEFAULT_TEXT_CONFIG)
        disableMiddleResizeButtons(newText)
        canvas?.add(newText)
        setTexts(texts => texts.concat(newText))
    }

    const onDraw = () => {
        if(canvas) {
            canvas.isDrawingMode = !isDrawingMode
            setIsDrawingMode(!isDrawingMode)
        }
    }

    return (
        <>
            {
                !isSmallScreen && openTextModal.open && (
                    <EditTextModal
                        deleteText={deleteText}
                        setOpen={setOpenTextModal}
                        index={openTextModal.index}
                        open={openTextModal.open}
                        text={texts[openTextModal.index]}
                        setConfig={setConfig}
                    />
                )
            }
            <UploadMemeError error={uploadError} setError={setUploadError} onRetry={handleConfirm} />
            <ConfirmModal show={showConfirm} setShow={setShowConfirm} onConfirm={handleConfirm} />
            <FeedbackModal show={loading} />
            <div className="flex flex-col lg:flex-row gap-10 items-start">
                <div className='comic-border bg-white n:p-4 lg:p-10 rounded-4xl relative w-full lg:w-3/5'>
                    <Resizable
                        enable={{
                            top: false,
                            right: false,
                            bottom: true,
                            left: false,
                            topRight: false,
                            bottomRight: false,
                            bottomLeft: false,
                            topLeft: false
                        }}
                        handleComponent={{
                            bottom: (
                            <button className="w-[24px] h-[24px] bg-primary-600 border-[2px] border-neutral-black rounded-full">
                                <img className="icon-sm" src="/assets/icons/resize.svg" alt="resize" />
                            </button>
                            )
                        }}
                        handleClasses={{
                            bottom: 'flex items-center justify-center'
                        }}
                    >
                        <div
                            className="overflow-hidden border-[1px] rounded-[12px] border-neutral-400 h-full"
                            ref={containerRef}
                        >
                            <canvas id="meme-editor" />
                        </div>
                    </Resizable>
                </div>
                {
                    isSmallScreen && openTextModal.open && (
                        <EditText 
                            deleteText={deleteText}
                            setOpen={setOpenTextModal}
                            index={openTextModal.index}
                            open={openTextModal.open}
                            text={texts[openTextModal.index]}
                            setConfig={setConfig}
                        />
                    )
                }
                <div className='main-container pb-[64px] relative w-full lg:w-2/5'>
                    <p className="text-subtitle-2 mb-[16px]">RE:MEME CONTROLS</p>
                    {
                        backgroundImage && (
                            <div className="flex justify-between w-full px-[16px] py-[12px] bg-neutral-200 rounded-[12px] mb-[16px]">
                                <span>{`Background image`}</span>
                                <button onClick={() => onDeleteBackgroundImage()}>
                                    <img src="/assets/icons/x.png"/>
                                </button>
                            </div>
                        )
                    }
                    {
                        texts.map((text, index) =>
                            <div key={`memixer_text_${index}`} className="border-2 border-black border-solid rounded-xl mb-[16px] flex p-2 gap-2 w-full">
                                <input
                                    onChange={e => handleMemeText(e, index)}
                                    className="w-full focus:outline-none"
                                    placeholder={`Text #${index + 1}`}
                                    value={text.text}
                                />
                                <button className="w-4 flex items-center" onClick={() => openEditTextModal(index)}>
                                    <img src="/assets/icons/pencil.svg" />
                                </button>
                            </div>
                        )
                    }
                    {
                        images.map((image, index) => (
                            <div className="flex justify-between w-full px-[16px] py-[12px] bg-neutral-200 rounded-[12px] mb-[16px]" key={`memixer_image_${index}`}>
                                <span>{`Image ${index + 1}`}</span>
                                <button onClick={() => onDeleteImage(index)}>
                                    <img src="/assets/icons/x.png"/>
                                </button>
                            </div>
                        ))
                    }
                                        {
                        drawings.map((draw, index) => (
                            <div className="flex justify-between w-full px-[16px] py-[12px] bg-neutral-200 rounded-[12px] mb-[16px]" key={`drawing_${index}`}>
                                <span>{`Drawing ${index + 1}`}</span>
                                <button onClick={() => onDeleteDraw(index)}>
                                    <img  src="/assets/icons/x.png"/>
                                </button>
                            </div>
                        ))
                    }
                    <div className="flex gap-[12px] mb-4">
                        <input id='upload-file' accept="image/*" hidden type="file" onChange={addImage} onClick={clearFileCache} />
                            <button disabled={texts.length >= 10} key="mbicon-text" onClick={onAddText} className="icon-btn-large-secondary">
                                <img className="icon-md" src="/assets/icons/edit-meme-1.svg" />
                            </button>
                            <button key="mbicon-image" onClick={uploadFileHandler} className="icon-btn-large-secondary">
                                <img className="icon-md" src="/assets/icons/edit-meme-2.svg" />
                            </button>
                            <button key="mbicon-draw" onClick={onDraw} className={`icon-btn-large-secondary ${isDrawingMode && 'bg-neutral-black shadow-none hover:bg-neutral-black'}`}>
                                <img className="icon-md" src={`${ isDrawingMode ? '/assets/icons/edit-meme-3-reverse.svg' : '/assets/icons/edit-meme-3.svg'}`}/>
                            </button>
                    </div>
                    <button disabled={!user} onClick={onRemix} className={"btn-large-tertiary absolute -bottom-10"}>
                        { publication ? 'REMIX' : 'CREATE' }
                    </button>
                </div>
            </div>
        </>
    );
}

export default EditStep;
