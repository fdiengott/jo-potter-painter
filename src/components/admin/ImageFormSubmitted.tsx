interface Props {
    success: boolean
}

export const ImageFormSubmitted = ({ success }: Props) => {
    if (success) {
        return (
            <div className="alert alert-success" role="alert">
                Images successfully uploaded!
            </div>
        )
    }
    return (
        <div className="alert alert-danger" role="alert">
            Something went wrong! Please try again.
        </div>
    )
}
